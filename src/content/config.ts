import { z, defineCollection } from 'astro:content';
import {
  optionalAssetPath,
  optionalHttpsUrl,
  optionalLinkUrl,
} from './link-url';

const sharedFields = {
  title: z.string(),
  summary: z.string(),
  publishedDate: z.date().optional(),
  draft: z.boolean().optional().default(false),
  featured: z.boolean().optional().default(false),
  legacyUrl: optionalHttpsUrl,
};

const articlesCollection = defineCollection({
  schema: z.object({
    ...sharedFields,
  }),
});

const novelsCollection = defineCollection({
  schema: z.object({
    ...sharedFields,
    publishedYear: z.number().optional(),
    awards: z.array(z.string()).optional(),
    purchaseUrl: optionalLinkUrl,
    coverImage: optionalAssetPath,
  }),
});

const playsCollection = defineCollection({
  schema: z.object({
    ...sharedFields,
    publishedYear: z.number().optional(),
    performanceDate: z.coerce.date().optional(),
    awards: z.array(z.string()).optional(),
    downloadUrl: optionalLinkUrl,
    coverImage: optionalAssetPath,
  }),
});

const proclamationsCollection = defineCollection({
  schema: z.object({
    ...sharedFields,
    publishedYear: z.number().optional(),
    eventDate: z.coerce.date().optional(),
    downloadUrl: optionalLinkUrl,
  }),
});

export const collections = {
  articles: articlesCollection,
  novels: novelsCollection,
  plays: playsCollection,
  proclamations: proclamationsCollection,
};
