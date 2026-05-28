import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    wpId: z.number(),
    title: z.string(),
    slug: z.string(),
    originalSlug: z.string().optional(), // original WP percent-encoded slug for redirects
    date: z.coerce.date(),
    modified: z.coerce.date().optional(),
    excerpt: z.string().default(''),
    description: z.string().default(''),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    featuredImage: z.string().optional(),
    featuredImageAlt: z.string().optional(),
    lang: z.enum(['zh-Hant', 'en', 'mixed']).default('mixed'),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    wpId: z.number(),
    title: z.string(),
    slug: z.string(),
    parent: z.string().optional(),
    description: z.string().default(''),
    lang: z.enum(['zh-Hant', 'en', 'mixed']).default('mixed'),
  }),
});

export const collections = { news, pages };
