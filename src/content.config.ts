import { defineCollection, z } from 'astro:content';
import { optionalLinkUrl } from './content/link-url';

const sharedFields = {
  title: z.string(),
  slug: z.string(),
  summary: z.string(),
  publishedDate: z.date().optional(),
  draft: z.boolean().optional().default(false),
  legacyUrl: z.string().url().optional(),
  featured: z.boolean().optional().default(false),
};

const articlesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    ...sharedFields,
  }),
});

const novelsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    ...sharedFields,
    publishedYear: z.number().optional(),
    purchaseUrl: optionalLinkUrl,
    awards: z.array(z.string()).optional(),
  }),
});

const playsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    ...sharedFields,
    performanceDate: z.date().optional(),
    awards: z.array(z.string()).optional(),
    downloadUrl: optionalLinkUrl,
  }),
});

const proclamationsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    ...sharedFields,
    eventDate: z.date().optional(),
    downloadUrl: optionalLinkUrl,
  }),
});

export const collections = {
  articles: articlesCollection,
  novels: novelsCollection,
  plays: playsCollection,
  proclamations: proclamationsCollection,
};
