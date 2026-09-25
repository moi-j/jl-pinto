import { z } from 'astro/zod';

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Site-root path (`/downloads/…`), not protocol-relative (`//evil.com`). */
function isSitePath(value: string): boolean {
  return (
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !/[\s<>]/.test(value)
  );
}

/** Absolute https URL (https://…) or site-root path (/downloads/…). */
export const linkUrl = z.string().refine(
  (value) => isHttpsUrl(value) || isSitePath(value),
  { error: 'Must be an https:// URL or a site path starting with a single /' },
);

export const optionalLinkUrl = linkUrl.optional();

export const optionalHttpsUrl = z
  .string()
  .refine(isHttpsUrl, { error: 'Must be an https:// URL' })
  .optional();

export const optionalAssetPath = z
  .string()
  .refine(
    (value) =>
      isSitePath(value) &&
      (/^\/images\//.test(value) ||
        /^\/assets\//.test(value) ||
        /^\/downloads\//.test(value) ||
        value === '/og-image.jpg'),
    {
      error:
        'Asset must be a local /images, /assets, /downloads, or /og-image.jpg path',
    },
  )
  .optional();
