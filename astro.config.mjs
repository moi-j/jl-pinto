import { defineConfig } from 'astro/config';
import { rehypePdfNewTab } from './src/plugins/rehype-pdf-new-tab.mjs';

export default defineConfig({
  site: 'https://jlpinto.com',
  output: 'static',
  compressHTML: true,
  integrations: [],
  markdown: {
    rehypePlugins: [rehypePdfNewTab],
  },
});
