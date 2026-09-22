#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir, writeFile, unlink } from 'fs/promises';
import fetch from 'node-fetch';
import { load as cheerioLoad } from 'cheerio';
import TurndownService from 'turndown';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const BASE_URL = 'https://jlpinto.com';
const CONTENT_DIR = path.join(projectRoot, 'src', 'content');
const DATA_DIR = path.join(projectRoot, 'src', 'data');
const ASSETS_DIR = path.join(projectRoot, 'public', 'assets');
const IMAGES_DIR = path.join(projectRoot, 'public', 'images');

const ARCHIVES = {
  articles: '/category/articulos/',
  plays: '/category/teatros/',
  proclamations: '/category/pregones/',
};

const BLOCKED_PHRASES = [
  'casino',
  '1xbet',
  'gambling',
  'apuestas',
  'poker',
  'cassino',
  'cassinos',
  'jogos e fornecedores',
  'igornykh',
  'azartnykh',
];

const SPAM_SLUGS = new Set([
  'legitimatsiia-azartnykh-utekh-v-ukrainskoi-respublike-porozhdaet-k-bystromu-usileniiu-populiarnosti-igornykh-domov',
  'descubra-novos-jogos-e-fornecedores-em-cassinos-online-recem-lancados',
]);

const NOVEL_YEARS = {
  virtudes: 2004,
  'la-ciudad-deseada': 2007,
  'el-vigia-puerta-oscura': 2015,
  'el-hombre-imposible': 2023,
  'el-viaje-de-ami': 2025,
};

const NOVEL_COVERS = {
  'el-viaje-de-ami':
    'https://jlpinto.com/wp-content/uploads/2025/11/Captura-de-pantalla-2025-11-29-a-las-11.09.18.png',
  'el-hombre-imposible':
    'https://jlpinto.com/wp-content/uploads/2023/03/978841255122.jpg',
  'el-vigia-puerta-oscura':
    'https://jlpinto.com/wp-content/uploads/2020/08/vigia-768x1231-1-639x1024.jpg',
  'la-ciudad-deseada':
    'https://jlpinto.com/wp-content/uploads/2020/08/UWOjUSBCI7hoH0ffu1OXgRvt.jpg',
  virtudes:
    'https://jlpinto.com/wp-content/uploads/2020/08/virtudes-1-666x1024.jpg',
};

const FEATURED_NOVELS = new Set(['el-viaje-de-ami', 'el-hombre-imposible']);

class WordPressImporter {
  constructor() {
    this.rssDates = new Map();
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      preserveNestedLists: true,
    });

    this.stats = {
      articles: 0,
      novels: 0,
      plays: 0,
      proclamations: 0,
      skipped: 0,
      errors: [],
    };
  }

  async run() {
    console.log('🚀 Starting WordPress migration...\n');

    await this.prepareDirs();
    await this.cleanCollections();
    await this.loadRssDateMap();

    for (const [collection, archivePath] of Object.entries(ARCHIVES)) {
      console.log(`\n📚 Importing ${collection}...`);
      const urls = await this.collectArchiveUrls(archivePath);
      console.log(`   Found ${urls.length} unique posts`);
      for (const url of urls) {
        await this.importPost(collection, url);
      }
    }

    console.log('\n📖 Importing novels from homepage...');
    await this.importNovelsFromHomepage();

    console.log('\n👤 Importing sobre-mí...');
    await this.importAboutPage();

    console.log('\n🖼️  Downloading author photo...');
    await this.downloadAuthorPhoto();

    this.printSummary();
  }

  async prepareDirs() {
    for (const dir of ['articles', 'novels', 'plays', 'proclamations']) {
      await mkdir(path.join(CONTENT_DIR, dir), { recursive: true });
    }
    await mkdir(ASSETS_DIR, { recursive: true });
    await mkdir(path.join(IMAGES_DIR, 'novelas'), { recursive: true });
    await mkdir(path.join(IMAGES_DIR, 'author'), { recursive: true });
    await mkdir(DATA_DIR, { recursive: true });
  }

  async cleanCollections() {
    for (const dir of ['articles', 'novels', 'plays', 'proclamations']) {
      const collectionDir = path.join(CONTENT_DIR, dir);
      for (const file of fs.readdirSync(collectionDir)) {
        if (file.endsWith('.md')) {
          await unlink(path.join(collectionDir, file));
        }
      }
    }
  }

  async loadRssDateMap() {
    console.log('\n📅 Loading publication dates from RSS…');
    let page = 1;
    let total = 0;

    while (page <= 12) {
      const feedUrl = `${BASE_URL}/feed/${page === 1 ? '' : `?paged=${page}`}`;
      const xml = await this.fetchUrl(feedUrl);
      if (!xml || !xml.includes('<item>')) break;

      const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      if (itemBlocks.length === 0) break;

      for (const block of itemBlocks) {
        const link = block.match(/<link>([^<]+)<\/link>/)?.[1]?.trim();
        const pubDate = block.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]?.trim();
        if (!link || !pubDate) continue;
        const slug = this.extractSlug(link);
        const iso = new Date(pubDate).toISOString().split('T')[0];
        if (iso && !Number.isNaN(Date.parse(iso))) {
          this.rssDates.set(slug, iso);
          total++;
        }
      }

      page++;
    }

    console.log(`   Mapped ${total} slugs to RSS dates`);
  }

  async collectArchiveUrls(archivePath) {
    const urls = new Set();
    let page = 1;

    while (true) {
      const pagePath =
        page === 1 ? archivePath : `${archivePath.replace(/\/$/, '')}/page/${page}/`;
      const html = await this.fetchUrl(new URL(pagePath, BASE_URL).href);
      if (!html) break;

      const $ = cheerioLoad(html);
      let foundOnPage = 0;

      $('.entry-title a, h2.entry-title a, article h2 a').each((_i, elem) => {
        const href = $(elem).attr('href');
        if (!href || !href.includes('jlpinto.com')) return;
        const url = new URL(href, BASE_URL).href;
        const slug = this.extractSlug(url);
        if (SPAM_SLUGS.has(slug) || url.includes('/category/')) return;
        if (!urls.has(url)) {
          urls.add(url);
          foundOnPage++;
        }
      });

      if (foundOnPage === 0) break;
      page++;
      if (page > 20) break;
    }

    return [...urls];
  }

  async importPost(collection, postUrl) {
    try {
      const slug = this.extractSlug(postUrl);
      if (SPAM_SLUGS.has(slug)) {
        this.stats.skipped++;
        return;
      }

      const html = await this.fetchUrl(postUrl);
      if (!html) return;

      const $ = cheerioLoad(html);

      const title = $(
        'h1.zak-page-title, h1.entry-title, .entry-header h1, article h1, h1',
      )
        .first()
        .text()
        .trim();
      if (!title) {
        this.stats.skipped++;
        return;
      }

      if (this.isBlocked($.html())) {
        console.log(`   ⏭️  Skipping (blocked): ${title}`);
        this.stats.skipped++;
        return;
      }

      const dateStr =
        $('time.entry-date').attr('datetime') ||
        $('time[datetime]').first().attr('datetime') ||
        $('[property="article:published_time"]').attr('content') ||
        this.rssDates.get(slug) ||
        '';
      const publishedDate = dateStr
        ? new Date(dateStr).toISOString().split('T')[0]
        : '';

      const entryContent = $('.entry-content').first();
      let bodyHtml = entryContent.html() || '';
      bodyHtml = this.cleanHtml(bodyHtml);

      const summary = this.buildSummary($, entryContent, bodyHtml);
      const markdown = this.turndown.turndown(bodyHtml || '');

      await this.extractAndDownloadMedia(slug, bodyHtml);

      const frontmatter = this.buildFrontmatter({
        title,
        publishedDate,
        summary,
        legacyUrl: postUrl,
        ...(collection === 'plays' && {
          performanceDate: this.extractSpanishDate(bodyHtml),
          awards: this.extractAwards(bodyHtml),
          downloadUrl: this.extractDownloadUrl(bodyHtml),
        }),
        ...(collection === 'proclamations' && {
          eventDate: this.extractSpanishDate(bodyHtml),
          downloadUrl: this.extractDownloadUrl(bodyHtml),
        }),
      });

      const filePath = path.join(CONTENT_DIR, collection, `${slug}.md`);
      await writeFile(filePath, `${frontmatter}\n\n${markdown}\n`, 'utf-8');

      this.stats[collection]++;
      console.log(`   ✅ ${title}`);
    } catch (error) {
      this.stats.errors.push(`Post ${postUrl}: ${error.message}`);
      console.error(`   ❌ ${postUrl}: ${error.message}`);
    }
  }

  async importNovelsFromHomepage() {
    const html = await this.fetchUrl(BASE_URL);
    if (!html) return;

    const $ = cheerioLoad(html);

    const headings = $('h2').toArray();
    for (const elem of headings) {
      const title = $(elem).text().trim();
      const id = $(elem).attr('id') || this.slugify(title);
      if (!title || title.length < 4) continue;

      const section = $(elem).nextUntil('h2');
      const excerpt =
        section
          .filter('p')
          .first()
          .text()
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 280) || '';
      const purchaseUrl =
        section.find('a[href*="librer"]').first().attr('href') || '';

      if (!excerpt && !purchaseUrl) continue;

      const slug = id === 'virtudes' ? 'virtudes-un-nombre-de-mujer' : id;
      const publishedYear = NOVEL_YEARS[id] || NOVEL_YEARS[slug];
      const featured = FEATURED_NOVELS.has(id);

      const paragraphs = [];
      section.filter('p').each((_j, p) => {
        const text = $(p).text().trim();
        if (text) paragraphs.push(text);
      });

      const body =
        paragraphs.length > 0
          ? paragraphs.map((p) => `${p}\n`).join('\n')
          : excerpt;

      const coverUrl = NOVEL_COVERS[id];
      let coverImage = '';
      if (coverUrl) {
        const ext = path.extname(new URL(coverUrl).pathname) || '.jpg';
        const localName = `${slug}${ext}`;
        coverImage = `/images/novelas/${localName}`;
        await this.downloadFile(
          coverUrl,
          path.join(IMAGES_DIR, 'novelas', localName),
        );
      }

      const frontmatter = this.buildFrontmatter({
        title,
        summary: excerpt || `${title}, novela de Juan Luis Pinto.`,
        publishedYear,
        purchaseUrl,
        featured,
        legacyUrl: `${BASE_URL}/#${id}`,
        coverImage,
      });

      const filePath = path.join(CONTENT_DIR, 'novels', `${slug}.md`);
      await writeFile(filePath, `${frontmatter}\n\n${body}\n`, 'utf-8');
      this.stats.novels++;
      console.log(`   ✅ Novel: ${title}`);
    }
  }

  async importAboutPage() {
    const html = await this.fetchUrl(`${BASE_URL}/sobre-mi/`);
    if (!html) return;

    const $ = cheerioLoad(html);
    const entry = $('.entry-content').first();
    entry.find('script, style, .sharedaddy').remove();

    const paragraphs = [];
    entry.find('p').each((_i, p) => {
      const text = $(p).text().trim();
      if (text) paragraphs.push(text);
    });

    const markdown = paragraphs.join('\n\n');
    await writeFile(path.join(DATA_DIR, 'sobre-mi.md'), markdown, 'utf-8');
    console.log(`   ✅ Biography (${paragraphs.length} paragraphs)`);
  }

  async downloadAuthorPhoto() {
    const url =
      'https://jlpinto.com/wp-content/uploads/2022/01/thumbnail_IMG-20190425-WA0034-2.jpg';
    const dest = path.join(IMAGES_DIR, 'author', 'jlpinto.jpg');
    await this.downloadFile(url, dest);
  }

  buildSummary($, entryContent, bodyHtml) {
    const metaDesc = $('meta[name="description"]').attr('content')?.trim();
    if (metaDesc && metaDesc.length > 20) {
      return this.truncate(metaDesc, 220);
    }

    const firstP = entryContent.find('p').first().text().trim();
    if (firstP) return this.truncate(firstP.replace(/\s+/g, ' '), 220);

    const plain = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return this.truncate(plain, 220) || 'Artículo de Juan Luis Pinto.';
  }

  truncate(text, max) {
    const clean = this.normalizeText(text);
    if (clean.length <= max) return clean.replace(/"/g, '\\"');
    return `${clean.slice(0, max - 1).trim()}…`.replace(/"/g, '\\"');
  }

  normalizeText(text) {
    return text
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async fetchUrl(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; JLPintoSiteMigrator/2.0; +https://jlpinto.es)',
        },
        timeout: 15000,
      });

      if (!response.ok) {
        console.warn(`   ⚠️  HTTP ${response.status} for ${url}`);
        return null;
      }

      return await response.text();
    } catch (error) {
      console.warn(`   ⚠️  Failed to fetch ${url}: ${error.message}`);
      return null;
    }
  }

  isBlocked(content) {
    const lower = content.toLowerCase();
    return BLOCKED_PHRASES.some((phrase) => lower.includes(phrase));
  }

  cleanHtml(html) {
    if (!html) return '';
    const $temp = cheerioLoad(`<div>${html}</div>`);
    $temp('script, style, nav, .nav, .sharedaddy, .wp-block-spacer').remove();

    $temp('a').each((_i, elem) => {
      const href = $temp(elem).attr('href') || '';
      const text = $temp(elem).text().toLowerCase();
      if (BLOCKED_PHRASES.some((p) => href.includes(p) || text.includes(p))) {
        $temp(elem).remove();
      }
    });

    return $temp('div').html() || '';
  }

  extractSlug(url) {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.replace(/\/$/, '');
    const segment = pathname.split('/').pop() || 'untitled';
    return segment.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'untitled';
  }

  slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  extractAwards(html) {
    const awards = [];
    const awardPattern = /PREMIO\s+([A-ZÁÉÍÓÚáéíóúñÑ\s]+)[\.,]?/gi;
    let match;
    while ((match = awardPattern.exec(html)) !== null) {
      const award = match[1].trim();
      if (award && !awards.includes(award)) awards.push(award);
    }
    return awards;
  }

  extractSpanishDate(html) {
    const datePattern = /(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/i;
    const match = html.match(datePattern);
    return match ? this.parseSpanishDate(match[1]) : '';
  }

  parseSpanishDate(dateStr) {
    const months = {
      enero: '01',
      febrero: '02',
      marzo: '03',
      abril: '04',
      mayo: '05',
      junio: '06',
      julio: '07',
      agosto: '08',
      septiembre: '09',
      octubre: '10',
      noviembre: '11',
      diciembre: '12',
    };
    const parts = dateStr.toLowerCase().split(/\s+de\s+/);
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = months[parts[1]] || '01';
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return '';
  }

  extractDownloadUrl(html) {
    const $ = cheerioLoad(html);
    let downloadUrl = '';
    $('a[href]').each((_i, elem) => {
      const href = $(elem).attr('href') || '';
      if (href.endsWith('.pdf') && href.includes('jlpinto.com')) {
        downloadUrl = href;
        return false;
      }
    });
    return downloadUrl;
  }

  async extractAndDownloadMedia(slug, html) {
    if (!html) return;
    const assetDir = path.join(ASSETS_DIR, slug);
    await mkdir(assetDir, { recursive: true });
    const $ = cheerioLoad(html);

    $('img[src]').each((_i, elem) => {
      const src = $(elem).attr('src');
      if (!src || !src.includes('jlpinto.com')) return;
      const url = new URL(src, BASE_URL).href;
      const filename = path.basename(new URL(url).pathname);
      this.downloadFile(url, path.join(assetDir, filename));
    });

    $('a[href$=".pdf"]').each((_i, elem) => {
      const href = $(elem).attr('href');
      if (!href?.includes('jlpinto.com')) return;
      const url = new URL(href, BASE_URL).href;
      const filename = path.basename(new URL(url).pathname);
      this.downloadFile(url, path.join(assetDir, filename));
    });
  }

  async downloadFile(url, filePath) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JLPintoSiteMigrator/2.0)' },
        timeout: 20000,
      });
      if (!response.ok) return;
      const buffer = await response.arrayBuffer();
      await mkdir(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, Buffer.from(buffer));
    } catch {
      console.warn(`   ⚠️  Failed to download ${url}`);
    }
  }

  buildFrontmatter(meta) {
    const yaml = ['---'];
    yaml.push(`title: "${String(meta.title).replace(/"/g, '\\"')}"`);
    if (meta.publishedDate) yaml.push(`publishedDate: ${meta.publishedDate}`);
    if (meta.publishedYear) yaml.push(`publishedYear: ${meta.publishedYear}`);
    if (meta.summary) yaml.push(`summary: "${String(meta.summary).replace(/"/g, '\\"')}"`);
    if (meta.featured) yaml.push('featured: true');
    if (meta.legacyUrl) yaml.push(`legacyUrl: "${meta.legacyUrl}"`);
    if (meta.purchaseUrl) yaml.push(`purchaseUrl: "${meta.purchaseUrl}"`);
    if (meta.coverImage) yaml.push(`coverImage: "${meta.coverImage}"`);
    if (meta.performanceDate) yaml.push(`performanceDate: ${meta.performanceDate}`);
    if (meta.eventDate) yaml.push(`eventDate: ${meta.eventDate}`);
    if (meta.downloadUrl) yaml.push(`downloadUrl: "${meta.downloadUrl}"`);
    if (meta.awards?.length) {
      yaml.push('awards:');
      meta.awards.forEach((award) => yaml.push(`  - "${award.replace(/"/g, '\\"')}"`));
    }
    yaml.push('---');
    return yaml.join('\n');
  }

  printSummary() {
    console.log('\n\n📊 Migration Summary:');
    console.log('─'.repeat(50));
    console.log(`Articles:      ${this.stats.articles}`);
    console.log(`Novels:        ${this.stats.novels}`);
    console.log(`Plays:         ${this.stats.plays}`);
    console.log(`Proclamations: ${this.stats.proclamations}`);
    console.log(`Skipped:       ${this.stats.skipped}`);
    console.log('─'.repeat(50));
    if (this.stats.errors.length) {
      console.log('\n⚠️  Errors:');
      this.stats.errors.slice(0, 8).forEach((err) => console.log(`   • ${err}`));
    }
    console.log('\n✅ Migration complete!');
  }
}

await new WordPressImporter().run();
