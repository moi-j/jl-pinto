import { defineConfig } from 'astro/config';
import rehypeSanitize from 'rehype-sanitize';
import { rehypePdfNewTab } from './src/plugins/rehype-pdf-new-tab.mjs';
import { markdownSanitizeSchema } from './src/plugins/rehype-sanitize-schema.mjs';

export default defineConfig({
  site: 'https://jlpinto.com',
  output: 'static',
  compressHTML: true,
  integrations: [],
  markdown: {
    rehypePlugins: [
      [rehypeSanitize, markdownSanitizeSchema],
      rehypePdfNewTab,
    ],
  },
});
