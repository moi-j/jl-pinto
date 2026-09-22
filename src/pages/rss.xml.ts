import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';

export async function GET(context: APIContext) {
  const articles = await getCollection('articles');

  // Sort by published date, most recent first
  const sortedArticles = articles.sort((a, b) => {
    if (!a.data.publishedDate || !b.data.publishedDate) return 0;
    return b.data.publishedDate.getTime() - a.data.publishedDate.getTime();
  });

  return rss({
    title: 'Artículos — J.L. Pinto',
    description: 'Los últimos artículos de J.L. Pinto sobre literatura, cultura y sociedad.',
    site: context.site ?? 'https://jlpinto.com',
    items: sortedArticles.map((article) => ({
      title: article.data.title,
      pubDate: article.data.publishedDate || new Date(),
      description: article.data.summary || '',
      link: `/articulos/${article.slug}/`,
    })),
    customData: `<language>es-es</language>`,
  });
}
