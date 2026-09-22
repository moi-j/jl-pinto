import { visit } from 'unist-util-visit';

const PDF_HREF = /\.pdf(?:[?#]|$)/i;

/** Open links to PDF files in a new tab (markdown / HTML content). */
export function rehypePdfNewTab() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a' || node.properties?.href == null) return;

      const href = String(node.properties.href);
      if (!PDF_HREF.test(href)) return;

      node.properties.target = '_blank';
      node.properties.rel = 'noopener noreferrer';
    });
  };
}
