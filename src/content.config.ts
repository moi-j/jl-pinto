import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import {
  optionalAssetPath,
  optionalHttpsUrl,
  optionalLinkUrl,
} from './content/link-url';

const sharedFields = {
  title: z.string(),
  summary: z.string(),
  publishedDate: z.coerce.date().optional(),
  draft: z.boolean().optional().default(false),
  featured: z.boolean().optional().default(false),
  legacyUrl: optionalHttpsUrl,
};

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    ...sharedFields,
  }),
});

const novels = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/novels' }),
  schema: z.object({
    ...sharedFields,
    publishedYear: z.number().optional(),
    awards: z.array(z.string()).optional(),
    purchaseUrl: optionalLinkUrl,
    coverImage: optionalAssetPath,
  }),
});

const plays = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/plays' }),
  schema: z.object({
    ...sharedFields,
    publishedYear: z.number().optional(),
    performanceDate: z.coerce.date().optional(),
    awards: z.array(z.string()).optional(),
    downloadUrl: optionalLinkUrl,
    coverImage: optionalAssetPath,
  }),
});

const proclamations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/proclamations' }),
  schema: z.object({
    ...sharedFields,
    publishedYear: z.number().optional(),
    eventDate: z.coerce.date().optional(),
    downloadUrl: optionalLinkUrl,
  }),
});

export const collections = {
  articles,
  novels,
  plays,
  proclamations,
};
