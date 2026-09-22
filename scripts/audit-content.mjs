#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const CONTENT_DIR = path.join(projectRoot, 'src', 'content');
const ASSETS_DIR = path.join(projectRoot, 'public', 'assets');

const BLOCKED_PHRASES = ['casino', '1xbet', 'gambling', 'apuestas', 'poker'];

const REQUIRED_FIELDS = {
  articles: ['title', 'summary'],
  novels: ['title', 'summary'],
  plays: ['title', 'summary'],
  proclamations: ['title', 'summary'],
};

const EXPECTED_COUNTS = {
  articles: 78,
  novels: 5,
  plays: 8,
  proclamations: 4,
};

class ContentAuditor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      articles: 0,
      novels: 0,
      plays: 0,
      proclamations: 0,
      missingImages: [],
      blockedContent: [],
    };
    this.slugs = new Set();
  }

  async run() {
    console.log('🔍 Auditing migrated content...\n');

    try {
      this.auditCollections();
      this.auditRequiredFields();
      this.auditMediaReferences();
      this.auditBlockedContent();
      this.auditExpectedCounts();
      this.printReport();
    } catch (error) {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    }
  }

  auditCollections() {
    console.log('📁 Scanning content collections...');
    
    for (const collection of Object.keys(REQUIRED_FIELDS)) {
      const collectionDir = path.join(CONTENT_DIR, collection);
      
      if (!fs.existsSync(collectionDir)) {
        this.errors.push(`Collection directory missing: ${collection}`);
        continue;
      }

      const files = fs.readdirSync(collectionDir).filter((f) => f.endsWith('.md'));
      this.stats[collection] = files.length;
      console.log(`   ${collection}: ${files.length} files`);

      // Check for duplicates
      for (const file of files) {
        const slug = file.replace('.md', '');
        
        if (this.slugs.has(slug)) {
          this.errors.push(`Duplicate slug: ${slug} (in ${collection})`);
        } else {
          this.slugs.add(slug);
        }
      }
    }
  }

  auditRequiredFields() {
    console.log('\n✋ Validating required fields...');
    let fieldsChecked = 0;

    for (const [collection, requiredFields] of Object.entries(REQUIRED_FIELDS)) {
      const collectionDir = path.join(CONTENT_DIR, collection);
      
      if (!fs.existsSync(collectionDir)) continue;

      const files = fs.readdirSync(collectionDir).filter((f) => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(collectionDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const frontmatter = this.extractFrontmatter(content);
        const slugFromFile = file.replace(/\.md$/, '');

        for (const field of requiredFields) {
          if (!frontmatter[field]) {
            this.errors.push(
              `Missing required field '${field}' in ${collection}/${file}`
            );
          }
        }

        const slug = frontmatter.slug || slugFromFile;
        if (!slug) {
          this.errors.push(`Missing slug (filename) in ${collection}/${file}`);
        }

        fieldsChecked++;
      }
    }

    console.log(`   Checked ${fieldsChecked} files`);
  }

  auditMediaReferences() {
    console.log('\n📸 Checking media references...');
    let refsChecked = 0;

    for (const collection of Object.keys(REQUIRED_FIELDS)) {
      const collectionDir = path.join(CONTENT_DIR, collection);
      
      if (!fs.existsSync(collectionDir)) continue;

      const files = fs.readdirSync(collectionDir).filter((f) => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(collectionDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Find all image and PDF references
        const mediaMatches = content.match(/!\[.*?\]\(\/assets\/([^)]+)\)|!?\[.*?\]\(([^)]+\.pdf)\)/g) || [];
        
        for (const match of mediaMatches) {
          const assetPath = match.match(/\/assets\/([^)]+)/)?.[1];
          if (assetPath) {
            const fullPath = path.join(ASSETS_DIR, assetPath);
            if (!fs.existsSync(fullPath)) {
              this.stats.missingImages.push(`${collection}/${file}: ${assetPath}`);
              this.warnings.push(`Missing asset: ${assetPath} (referenced in ${collection}/${file})`);
            }
          }
          refsChecked++;
        }
      }
    }

    console.log(`   Checked ${refsChecked} media references`);
  }

  auditBlockedContent() {
    console.log('\n🚫 Scanning for blocked content...');

    for (const collection of Object.keys(REQUIRED_FIELDS)) {
      const collectionDir = path.join(CONTENT_DIR, collection);
      
      if (!fs.existsSync(collectionDir)) continue;

      const files = fs.readdirSync(collectionDir).filter((f) => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(collectionDir, file);
        const content = fs.readFileSync(filePath, 'utf-8').toLowerCase();

        for (const phrase of BLOCKED_PHRASES) {
          if (content.includes(phrase)) {
            this.stats.blockedContent.push(`${collection}/${file}: contains "${phrase}"`);
            this.errors.push(`Blocked content in ${collection}/${file}: "${phrase}"`);
          }
        }
      }
    }

    console.log(`   Found ${this.stats.blockedContent.length} instances`);
  }

  auditExpectedCounts() {
    console.log('\n📊 Validating content counts...');

    for (const [collection, expected] of Object.entries(EXPECTED_COUNTS)) {
      const actual = this.stats[collection];
      const status = actual === expected ? '✅' : actual > expected ? '⚠️ ' : '❌';
      
      console.log(`   ${status} ${collection}: ${actual}/${expected}`);
      
      if (actual < expected * 0.3) {
        // Less than 30% of expected
        this.errors.push(
          `Low content count for ${collection}: ${actual}/${expected}`
        );
      } else if (actual < expected) {
        // Less than expected but substantial
        this.warnings.push(
          `Content count below target for ${collection}: ${actual}/${expected}`
        );
      }
    }
  }

  extractFrontmatter(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return {};

    const frontmatterStr = frontmatterMatch[1];
    const frontmatter = {};

    // Simple YAML parser for our use case
    const lines = frontmatterStr.split('\n');
    let currentKey = null;

    for (const line of lines) {
      if (line.match(/^[a-z]/i) && line.includes(':')) {
        const [key, value] = line.split(':').map((s) => s.trim());
        currentKey = key;
        frontmatter[key] = value.replace(/^["']|["']$/g, '');
      }
    }

    return frontmatter;
  }

  printReport() {
    const totalErrors = this.errors.length;
    const totalWarnings = this.warnings.length;

    console.log('\n\n📋 Audit Report:');
    console.log('═'.repeat(60));
    
    console.log('\n📦 Content Inventory:');
    console.log(`   Articles:      ${this.stats.articles}/${EXPECTED_COUNTS.articles}`);
    console.log(`   Novels:        ${this.stats.novels}/${EXPECTED_COUNTS.novels}`);
    console.log(`   Plays:         ${this.stats.plays}/${EXPECTED_COUNTS.plays}`);
    console.log(`   Proclamations: ${this.stats.proclamations}/${EXPECTED_COUNTS.proclamations}`);
    console.log(`   Total Slugs:   ${this.slugs.size}`);

    if (this.stats.blockedContent.length > 0) {
      console.log(`\n🚫 Blocked Content Found: ${this.stats.blockedContent.length}`);
      this.stats.blockedContent.slice(0, 3).forEach((item) => {
        console.log(`   • ${item}`);
      });
      if (this.stats.blockedContent.length > 3) {
        console.log(`   ... and ${this.stats.blockedContent.length - 3} more`);
      }
    }

    if (this.stats.missingImages.length > 0) {
      console.log(`\n📸 Missing Assets: ${this.stats.missingImages.length}`);
      this.stats.missingImages.slice(0, 3).forEach((item) => {
        console.log(`   • ${item}`);
      });
      if (this.stats.missingImages.length > 3) {
        console.log(`   ... and ${this.stats.missingImages.length - 3} more`);
      }
    }

    if (totalErrors > 0) {
      console.log(`\n❌ Errors: ${totalErrors}`);
      this.errors.slice(0, 5).forEach((err) => {
        console.log(`   • ${err}`);
      });
      if (totalErrors > 5) {
        console.log(`   ... and ${totalErrors - 5} more`);
      }
    }

    if (totalWarnings > 0) {
      console.log(`\n⚠️  Warnings: ${totalWarnings}`);
      this.warnings.slice(0, 5).forEach((warn) => {
        console.log(`   • ${warn}`);
      });
      if (totalWarnings > 5) {
        console.log(`   ... and ${totalWarnings - 5} more`);
      }
    }

    console.log('\n' + '═'.repeat(60));
    
    if (totalErrors === 0) {
      console.log('✅ Audit passed!');
      process.exit(0);
    } else {
      console.log(`❌ Audit failed with ${totalErrors} error(s)`);
      process.exit(1);
    }
  }
}

// Run the auditor
const auditor = new ContentAuditor();
await auditor.run();
