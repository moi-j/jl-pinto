import { z, defineCollection } from 'astro:content';
import { optionalLinkUrl } from './link-url';

const articlesCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    publishedDate: z.date().optional(),
    summary: z.string(),
    featured: z.boolean().optional(),
    legacyUrl: z.string().optional(),
  }),
});

const novelsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedYear: z.number().optional(),
    publishedDate: z.date().optional(),
    awards: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    purchaseUrl: optionalLinkUrl,
    coverImage: z.string().optional(),
    legacyUrl: z.string().optional(),
  }),
});

const playsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedDate: z.date().optional(),
    publishedYear: z.number().optional(),
    performanceDate: z.coerce.date().optional(),
    awards: z.array(z.string()).optional(),
    downloadUrl: optionalLinkUrl,
    coverImage: z.string().optional(),
    featured: z.boolean().optional(),
    legacyUrl: z.string().optional(),
  }),
});

const proclamationsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedDate: z.date().optional(),
    publishedYear: z.number().optional(),
    eventDate: z.coerce.date().optional(),
    downloadUrl: optionalLinkUrl,
    featured: z.boolean().optional(),
    legacyUrl: z.string().optional(),
  }),
});

export const collections = {
  articles: articlesCollection,
  novels: novelsCollection,
  plays: playsCollection,
  proclamations: proclamationsCollection,
};
