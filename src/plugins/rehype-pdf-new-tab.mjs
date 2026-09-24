import { visit } from 'unist-util-visit';

const PDF_HREF = /\.pdf(?:[?#]|$)/i;

function isExternalHref(href) {
  return /^(https?:)?\/\//i.test(href);
}

/** Open PDF and off-site links in a new tab with noopener. */
export function rehypePdfNewTab() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a' || node.properties?.href == null) return;

      const href = String(node.properties.href);
      if (!PDF_HREF.test(href) && !isExternalHref(href)) return;

      node.properties.target = '_blank';
      node.properties.rel = 'noopener noreferrer';
    });
  };
}
