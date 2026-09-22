import { getCollection } from 'astro:content';

export async function GET() {
  const articles = await getCollection('articles');
  const novels = await getCollection('novels');
  const plays = await getCollection('plays');
  const proclamations = await getCollection('proclamations');

  const today = new Date().toISOString().split('T')[0];

  // Build XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Homepage
  xml += '  <url>\n';
  xml += '    <loc>https://jlpinto.com/</loc>\n';
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';

  // About page
  xml += '  <url>\n';
  xml += '    <loc>https://jlpinto.com/sobre-mi/</loc>\n';
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>monthly</changefreq>\n';
  xml += '    <priority>0.8</priority>\n';
  xml += '  </url>\n';

  // Articles archive
  xml += '  <url>\n';
  xml += '    <loc>https://jlpinto.com/articulos/</loc>\n';
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>0.9</priority>\n';
  xml += '  </url>\n';

  // Articles detail pages
  for (const article of articles) {
    const lastmod = article.data.publishedDate
      ? article.data.publishedDate.toISOString().split('T')[0]
      : today;

    xml += '  <url>\n';
    xml += `    <loc>https://jlpinto.com/articulos/${article.slug}/</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  }

  // Novels archive
  xml += '  <url>\n';
  xml += '    <loc>https://jlpinto.com/novelas/</loc>\n';
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>monthly</changefreq>\n';
  xml += '    <priority>0.9</priority>\n';
  xml += '  </url>\n';

  // Novels detail pages
  for (const novel of novels) {
    const lastmod = novel.data.publishedDate
      ? novel.data.publishedDate.toISOString().split('T')[0]
      : today;

    xml += '  <url>\n';
    xml += `    <loc>https://jlpinto.com/novelas/${novel.slug}/</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  }

  // Plays archive
  xml += '  <url>\n';
  xml += '    <loc>https://jlpinto.com/teatro/</loc>\n';
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>monthly</changefreq>\n';
  xml += '    <priority>0.9</priority>\n';
  xml += '  </url>\n';

  // Plays detail pages
  for (const play of plays) {
    const lastmod = play.data.publishedDate
      ? play.data.publishedDate.toISOString().split('T')[0]
      : today;

    xml += '  <url>\n';
    xml += `    <loc>https://jlpinto.com/teatro/${play.slug}/</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  }

  // Proclamations archive
  xml += '  <url>\n';
  xml += '    <loc>https://jlpinto.com/pregones/</loc>\n';
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += '    <changefreq>monthly</changefreq>\n';
  xml += '    <priority>0.9</priority>\n';
  xml += '  </url>\n';

  // Proclamations detail pages
  for (const proclamation of proclamations) {
    const lastmod = proclamation.data.publishedDate
      ? proclamation.data.publishedDate.toISOString().split('T')[0]
      : today;

    xml += '  <url>\n';
    xml += `    <loc>https://jlpinto.com/pregones/${proclamation.slug}/</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  }

  xml += '</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
