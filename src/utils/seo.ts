/**
 * SEO utilities for generating metadata, structured data, and canonical URLs
 */

export interface OpenGraphMeta {
  title: string;
  description: string;
  url: string;
  image?: string;
  type: 'website' | 'article' | 'book';
  locale?: string;
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

/**
 * Generate canonical URL for a page
 */
export const SITE_URL = 'https://jlpinto.com';

export const DEFAULT_OG_IMAGE_PATH = '/og-image.jpg';

const SITE_HOSTS = new Set(['jlpinto.com', 'www.jlpinto.com']);

export function getCanonicalUrl(path: string): string {
  if (path.startsWith('https://')) {
    try {
      const url = new URL(path);
      if (SITE_HOSTS.has(url.hostname)) return url.href;
    } catch {
      return `${SITE_URL}/`;
    }
    return `${SITE_URL}/`;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('//')) return `${SITE_URL}/`;
  return `${SITE_URL}${cleanPath}`;
}

/** Absolute URL for Open Graph / Twitter images (required by Facebook, WhatsApp, etc.). */
export function getAbsoluteAssetUrl(path: string): string {
  if (path.startsWith('https://')) {
    try {
      const url = new URL(path);
      if (SITE_HOSTS.has(url.hostname)) return path;
    } catch {
      return getCanonicalUrl(DEFAULT_OG_IMAGE_PATH);
    }
    return getCanonicalUrl(DEFAULT_OG_IMAGE_PATH);
  }
  if (!path.startsWith('/') || path.startsWith('//')) {
    return getCanonicalUrl(DEFAULT_OG_IMAGE_PATH);
  }
  return getCanonicalUrl(path);
}

/** JSON-LD for inline <script> — escape < so titles cannot break out of the tag. */
export function toJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Generate OpenGraph metadata object
 */
export function getOpenGraphMeta(config: OpenGraphMeta): Record<string, string> {
  return {
    'og:title': config.title,
    'og:description': config.description,
    'og:url': config.url,
    'og:type': config.type === 'article' ? 'article' : config.type === 'book' ? 'book' : 'website',
    'og:image': config.image || getCanonicalUrl('/og-image.jpg'),
    'og:locale': config.locale || 'es_ES',
  };
}

/**
 * Generate Person schema (for author: Juan Luis Pinto)
 */
export function getPersonSchema(name: string = 'Juan Luis Pinto'): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: name,
    url: getCanonicalUrl('/'),
    sameAs: [
      'https://www.linkedin.com/in/juanluispinto',
      'https://twitter.com/jlpinto',
    ],
  };
}

/**
 * Generate Book schema for novels
 */
export function getBookSchema(config: {
  name: string;
  author: string;
  datePublished: Date;
  description?: string;
  url: string;
  image?: string;
}): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: config.name,
    author: {
      '@type': 'Person',
      name: config.author,
    },
    datePublished: config.datePublished.toISOString().split('T')[0],
    inLanguage: 'es',
    description: config.description,
    url: config.url,
    image: config.image || getCanonicalUrl('/og-image.jpg'),
  };
}

/**
 * Generate CreativeWork schema (for plays and proclamations)
 */
export function getCreativeWorkSchema(config: {
  name: string;
  author: string;
  datePublished: Date;
  description?: string;
  url: string;
  workType: 'Play' | 'Proclamation' | 'Article';
  image?: string;
}): StructuredData {
  const typeMap = {
    'Play': 'CreativeWork',
    'Proclamation': 'CreativeWork',
    'Article': 'BlogPosting',
  };

  return {
    '@context': 'https://schema.org',
    '@type': typeMap[config.workType] || 'CreativeWork',
    name: config.name,
    author: {
      '@type': 'Person',
      name: config.author,
    },
    datePublished: config.datePublished.toISOString().split('T')[0],
    inLanguage: 'es',
    description: config.description,
    url: config.url,
    image: config.image || getCanonicalUrl('/og-image.jpg'),
  };
}

/**
 * Generate BlogPosting schema for articles
 */
export function getBlogPostingSchema(config: {
  title: string;
  description: string;
  datePublished: Date;
  dateModified?: Date;
  url: string;
  author: string;
  image?: string;
}): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: config.title,
    description: config.description,
    datePublished: config.datePublished.toISOString().split('T')[0],
    dateModified: config.dateModified?.toISOString().split('T')[0] || config.datePublished.toISOString().split('T')[0],
    author: {
      '@type': 'Person',
      name: config.author,
    },
    url: config.url,
    image: config.image || getCanonicalUrl('/og-image.jpg'),
  };
}

/**
 * Generate Website schema (for homepage)
 */
export function getWebsiteSchema(config: {
  title: string;
  description: string;
  url: string;
  image?: string;
}): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.title,
    description: config.description,
    url: config.url,
    image: config.image || getCanonicalUrl('/og-image.jpg'),
  };
}
