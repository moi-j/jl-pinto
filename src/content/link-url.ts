import { z } from 'astro:content';

/** Absolute URL (https://…) or site-root path (/downloads/…). */
export const linkUrl = z.union([
  z.string().url(),
  z.string().regex(/^\//, { message: 'Site path must start with /' }),
]);

export const optionalLinkUrl = linkUrl.optional();
