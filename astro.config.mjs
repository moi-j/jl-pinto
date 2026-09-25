import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeSanitize from 'rehype-sanitize';
import { rehypePdfNewTab } from './src/plugins/rehype-pdf-new-tab.mjs';
import { markdownSanitizeSchema } from './src/plugins/rehype-sanitize-schema.mjs';

export default defineConfig({
  site: 'https://jlpinto.com',
  output: 'static',
  compressHTML: true,
  // Hover prefetch warms the HTTP cache; HTML Cache-Control on /* helps ClientRouter reuse it on click.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  build: {
    inlineStylesheets: 'never',
  },
  integrations: [],
  markdown: {
    processor: unified({
      rehypePlugins: [
        [rehypeSanitize, markdownSanitizeSchema],
        rehypePdfNewTab,
      ],
    }),
  },
});
