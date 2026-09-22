#!/usr/bin/env node

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

const COLLECTIONS = [
  { dir: 'plays', publicFolder: 'teatro' },
  { dir: 'proclamations', publicFolder: 'pregones' },
];

const WP_PDF =
  /https?:\/\/(?:www\.)?jlpinto\.com\/wp-content\/uploads\/[^)\s"']+\.pdf/gi;

function isPdfBuffer(buf) {
  return buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === '%PDF';
}

async function fetchPdfBuffer(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (!isPdfBuffer(buf)) {
    throw new Error('Not a valid PDF (missing %PDF header)');
  }
  return buf;
}

async function downloadPdf(url) {
  try {
    return await fetchPdfBuffer(url);
  } catch (firstError) {
    if (url.startsWith('https://')) {
      const httpUrl = url.replace(/^https:\/\//, 'http://');
      try {
        return await fetchPdfBuffer(httpUrl);
      } catch {
        throw firstError;
      }
    }
    throw firstError;
  }
}

const WP_PDF_IN_HTML =
  /https?:\/\/(?:www\.)?jlpinto\.com\/wp-content\/uploads\/[^"'\\s]+?\.pdf/gi;

async function discoverPdfUrlFromLegacy(legacyUrl) {
  const res = await fetch(legacyUrl, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Legacy page HTTP ${res.status}`);
  }
  const html = await res.text();
  const match = html.match(WP_PDF_IN_HTML);
  return match?.[0] ?? null;
}

async function readValidLocalPdf(diskPath) {
  try {
    const buf = await fs.readFile(diskPath);
    if (!isPdfBuffer(buf)) {
      await fs.unlink(diskPath);
      return null;
    }
    return buf;
  } catch {
    return null;
  }
}

function upsertFrontmatterField(frontmatter, key, value) {
  const line = `${key}: "${value}"`;
  if (new RegExp(`^${key}:`, 'm').test(frontmatter)) {
    return frontmatter.replace(new RegExp(`^${key}:.*$`, 'm'), line);
  }
  return `${frontmatter.trimEnd()}\n${line}\n`;
}

async function processFile(contentPath, publicFolder) {
  const slug = contentPath.replace(/\.md$/, '').split('/').pop();
  let content = await fs.readFile(contentPath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  let frontmatter = frontmatterMatch[1];
  const body = content.slice(frontmatterMatch[0].length).replace(/^\n+/, '');

  const localPath = `/downloads/${publicFolder}/${slug}.pdf`;
  const diskPath = join(projectRoot, 'public', 'downloads', publicFolder, `${slug}.pdf`);

  let remoteUrl =
    frontmatter.match(/^downloadUrl:\s*"(https?:\/\/[^"]+\.pdf)"/m)?.[1] ?? null;

  const legacyUrl = frontmatter.match(/^legacyUrl:\s*"([^"]+)"/m)?.[1] ?? null;

  if (!remoteUrl && legacyUrl) {
    remoteUrl = await discoverPdfUrlFromLegacy(legacyUrl);
    if (remoteUrl) {
      frontmatter = upsertFrontmatterField(frontmatter, 'downloadUrl', remoteUrl);
    }
  }

  if (!remoteUrl) {
    const existing = await readValidLocalPdf(diskPath);
    if (existing) {
      frontmatter = upsertFrontmatterField(frontmatter, 'downloadUrl', localPath);
      let updatedBody = body.replace(WP_PDF, localPath);
      if (!updatedBody.includes(localPath)) {
        updatedBody = `[Descargar en pdf](${localPath})\n\n${updatedBody}`.trim();
      }
      await fs.writeFile(
        contentPath,
        `---\n${frontmatter.trimEnd()}\n---\n\n${updatedBody}\n`,
        'utf-8',
      );
      return { slug, localPath, status: 'ok-existing', remoteUrl: null };
    }
    return null;
  }

  await fs.mkdir(dirname(diskPath), { recursive: true });

  let status = 'ok';
  try {
    const buf = await downloadPdf(remoteUrl);
    await fs.writeFile(diskPath, buf);
  } catch (err) {
    status = 'failed';
    console.error(`✗ Failed ${slug}: ${remoteUrl} — ${err.message}`);
    const existing = await readValidLocalPdf(diskPath);
    if (existing) {
      status = 'ok-existing';
      console.warn(`  Using existing file at ${localPath}`);
    } else {
      await fs.writeFile(
        contentPath,
        `---\n${frontmatter.trimEnd()}\n---\n\n${body}`,
        'utf-8',
      );
      return { slug, localPath, status: 'failed', remoteUrl };
    }
  }

  frontmatter = upsertFrontmatterField(frontmatter, 'downloadUrl', localPath);
  let updatedBody = body.replace(WP_PDF, localPath);
  if (!updatedBody.includes(localPath)) {
    updatedBody = `[Descargar en pdf](${localPath})\n\n${updatedBody}`.trim();
  }

  await fs.writeFile(
    contentPath,
    `---\n${frontmatter.trimEnd()}\n---\n\n${updatedBody}\n`,
    'utf-8',
  );

  return { slug, localPath, status, remoteUrl };
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  const results = [];

  for (const { dir, publicFolder } of COLLECTIONS) {
    const contentDir = join(projectRoot, 'src', 'content', dir);
    const files = (await fs.readdir(contentDir)).filter((f) => f.endsWith('.md'));

    for (const file of files) {
      const result = await processFile(join(contentDir, file), publicFolder);
      if (result) results.push(result);
    }
  }

  console.log('\nPDF migration summary:');
  for (const r of results) {
    console.log(`  ${r.status === 'failed' ? '✗' : '✓'} ${r.localPath} (${r.slug})`);
  }

  const failed = results.filter((r) => r.status === 'failed');
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
