import { defineConfig } from 'astro/config';
import rehypeSanitize from 'rehype-sanitize';
import { rehypePdfNewTab } from './src/plugins/rehype-pdf-new-tab.mjs';
import { markdownSanitizeSchema } from './src/plugins/rehype-sanitize-schema.mjs';

export default defineConfig({
  site: 'https://jlpinto.com',
  output: 'static',
  compressHTML: true,
  // View Transitions always fetch HTML on click; hover prefetch uses <link rel=prefetch>,
  // which browsers often do not reuse for that fetch (see astro#10907). prefetchAll: false
  // avoids a redundant hover request; HTML Cache-Control below helps the navigation fetch.
  prefetch: {
    prefetchAll: false,
  },
  build: {
    inlineStylesheets: 'never',
  },
  integrations: [],
  markdown: {
    rehypePlugins: [
      [rehypeSanitize, markdownSanitizeSchema],
      rehypePdfNewTab,
    ],
  },
});
