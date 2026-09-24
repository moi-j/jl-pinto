export const SITE_ORIGIN = 'https://jlpinto.com';
export const SITE_HOSTS = new Set(['jlpinto.com', 'www.jlpinto.com']);

export function isAllowedSiteUrl(urlString, base = SITE_ORIGIN) {
  try {
    const url = new URL(urlString, base);
    return url.protocol === 'https:' && SITE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function isSafeHref(href, base = SITE_ORIGIN) {
  const value = (href ?? '').trim();
  if (!value) return false;
  if (value.startsWith('#') || value.startsWith('mailto:')) return true;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value, base);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
