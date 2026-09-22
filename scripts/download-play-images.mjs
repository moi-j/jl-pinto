#!/usr/bin/env node

import { promises as fs } from 'fs';
import { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(projectRoot, 'src', 'content', 'plays');
const IMAGES_DIR = join(projectRoot, 'public', 'images', 'teatro');
const CATEGORY_URL = 'https://jlpinto.com/category/teatros/';

function slugFromLegacyUrl(url) {
  const path = new URL(url).pathname.replace(/\/$/, '');
  return path.split('/').filter(Boolean).pop();
}

function decodeHtml(text) {
  return text
    .replace(/&#8211;/g, '–')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function parseCategoryPage(html) {
  const articles = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)].map(
    (match) => match[1],
  );

  const bySlug = new Map();

  for (const article of articles) {
    const href = (article.match(/<h2[^>]*>\s*<a[^>]+href="([^"]+)"/i) || [])[1];
    const img = (article.match(/<img[^>]+src="([^"]+)"/i) || [])[1];
    if (!href) continue;
    const slug = slugFromLegacyUrl(href);
    if (img) {
      bySlug.set(slug, img);
    }
    const title = decodeHtml(
      (article.match(/<h2[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i) || [])[2] || '',
    );
    if (title) {
      console.log(`  ${slug}: ${img ? '✓' : '— sin imagen'} (${title})`);
    }
  }

  return bySlug;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 500) {
    throw new Error(`Image too small (${buf.length} bytes)`);
  }
  await fs.writeFile(destPath, buf);
}

async function updateFrontmatter(filePath, coverImage) {
  let content = await fs.readFile(filePath, 'utf-8');
  if (!content.startsWith('---\n')) return;

  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return;

  const front = content.slice(4, end);
  const body = content.slice(end + 5);

  const line = `coverImage: "${coverImage}"`;
  let updatedFront;
  if (/^coverImage:/m.test(front)) {
    updatedFront = front.replace(/^coverImage:.*$/m, line);
  } else {
    updatedFront = `${front.trimEnd()}\n${line}\n`;
  }

  await fs.writeFile(filePath, `---\n${updatedFront}---\n\n${body}`, 'utf-8');
}

async function main() {
  console.log(`Fetching ${CATEGORY_URL}\n`);
  const html = await fetch(CATEGORY_URL).then((r) => r.text());
  const imagesBySlug = parseCategoryPage(html);

  await fs.mkdir(IMAGES_DIR, { recursive: true });

  const files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith('.md'));
  let downloaded = 0;
  let skipped = 0;

  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const remoteUrl = imagesBySlug.get(slug);
    if (!remoteUrl) {
      skipped++;
      continue;
    }

    const ext = extname(new URL(remoteUrl).pathname) || '.jpg';
    const localPath = `/images/teatro/${slug}${ext}`;
    const diskPath = join(IMAGES_DIR, `${slug}${ext}`);

    process.stdout.write(`Downloading ${slug}${ext}… `);
    await downloadImage(remoteUrl, diskPath);
    await updateFrontmatter(join(CONTENT_DIR, file), localPath);
    console.log('ok');
    downloaded++;
  }

  console.log(`\nDone: ${downloaded} images saved, ${skipped} plays without category thumbnail.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
