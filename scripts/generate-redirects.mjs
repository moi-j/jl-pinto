import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

/**
 * Generate _redirects file from content collections
 * Maps legacy WordPress URLs to new Astro URLs
 */

async function generateRedirects() {
  try {
    // Define redirect rules
    // Format: source destination [status] [conditions]
    const baseRedirects = [
      // Category redirects
      '/category/articulos/ /articulos/ 301',
      '/category/teatros/ /teatro/ 301',
      '/category/novelas/ /novelas/ 301',
      '/category/pregones/ /pregones/ 301',
      
      // Common legacy paths
      '/sobre-mi/ /sobre-mi/ 200',
      '/buscar/ / 301',
    ];

    // Try to load content files to detect legacy URLs
    const contentDirs = ['articles', 'plays', 'novels', 'proclamations'];
    const legacyRedirects = new Map();

    for (const contentType of contentDirs) {
      try {
        const contentPath = join(projectRoot, 'src', 'content', contentType);
        const files = await fs.readdir(contentPath);

        for (const file of files) {
          if (!file.endsWith('.md')) continue;

          const filePath = join(contentPath, file);
          const content = await fs.readFile(filePath, 'utf-8');

          // Extract frontmatter
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          if (!frontmatterMatch) continue;

          const frontmatter = frontmatterMatch[1];
          const legacyUrlMatch = frontmatter.match(/^legacyUrl:\s*(.+)$/m);

          if (legacyUrlMatch) {
            // Use filename as slug (without .md extension)
            const slug = file.replace(/\.md$/, '');
            const legacyUrl = legacyUrlMatch[1]
              .trim()
              .replace(/^["']|["']$/g, '');

            // Map the legacy URL to the new one
            let newUrl = '';
            switch (contentType) {
              case 'articles':
                newUrl = `/articulos/${slug}/`;
                break;
              case 'plays':
                newUrl = `/teatro/${slug}/`;
                break;
              case 'novels':
                newUrl = `/novelas/${slug}/`;
                break;
              case 'proclamations':
                newUrl = `/pregones/${slug}/`;
                break;
            }

            if (legacyUrl && newUrl) {
              // Extract path from URL
              try {
                const urlObj = new URL(legacyUrl);
                const legacyPath = urlObj.pathname;

                // Hash-only legacy URLs (e.g. jlpinto.com/#virtudes) must not redirect /
                if (legacyPath === '/' || legacyPath === '') {
                  continue;
                }

                legacyRedirects.set(legacyPath, `${newUrl} 301`);
              } catch (e) {
                // If it's not a valid URL, skip it
                console.warn(`Invalid URL in ${file}: ${legacyUrl}`);
              }
            }
          }
        }
      } catch (error) {
        // Content directory might not exist or be empty
        console.warn(`Could not read content directory: ${contentType}`);
      }
    }

    // Combine base redirects and content-based redirects
    const allRedirects = [
      ...baseRedirects,
      ...Array.from(legacyRedirects.entries()).map(([source, destination]) => `${source} ${destination}`),
    ];

    // Write _redirects file to public directory
    const redirectsPath = join(projectRoot, 'public', '_redirects');
    const redirectsContent = allRedirects.join('\n') + '\n';

    await fs.writeFile(redirectsPath, redirectsContent, 'utf-8');

    console.log(`✓ Generated ${redirectsPath}`);
    console.log(`✓ Total redirects: ${allRedirects.length}`);
    console.log(`  - Base redirects: ${baseRedirects.length}`);
    console.log(`  - Content-based redirects: ${legacyRedirects.size}`);

    // Show sample of generated redirects
    if (legacyRedirects.size > 0) {
      console.log('\nSample legacy URL redirects:');
      let count = 0;
      for (const [source, destination] of legacyRedirects) {
        if (count >= 5) break;
        console.log(`  ${source} → ${destination}`);
        count++;
      }
      if (legacyRedirects.size > 5) {
        console.log(`  ... and ${legacyRedirects.size - 5} more`);
      }
    }
  } catch (error) {
    console.error('Error generating redirects:', error);
    process.exit(1);
  }
}

generateRedirects();
