import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * WORKS — the gallery. One markdown file per piece.
 * The artist adds a new work by dropping an image into /public/works and
 * creating a file here (or via the /admin visual editor). `image` may be left
 * empty: the gallery then renders an elegant "coming soon" placeholder slot.
 */
const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    category: z
      .enum(['architecture', 'animals', 'botanical', 'watercolor', 'travel'])
      .default('architecture'),
    tags: z.array(z.string()).default([]),
    medium: z.string().default('Pen & ink on paper'),
    year: z.number().optional(),
    location: z.string().optional(),
    /** Public path, e.g. /works/lion.jpg — or empty for a placeholder slot. */
    image: z.string().optional(),
    alt: z.string().default(''),
    description: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(100),
    draft: z.boolean().default(false),
    /** Marks an intentional empty slot the artist can fill later. */
    placeholder: z.boolean().default(false),
  }),
});

/**
 * PROJECTS — long-form case studies / collections shown in the pinned
 * horizontal storytelling section.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    year: z.number().optional(),
    role: z.string().optional(),
    collaborator: z.string().optional(),
    collaboratorUrl: z.string().url().optional(),
    category: z.string().default('Series'),
    cover: z.string(),
    images: z
      .array(z.object({ src: z.string(), alt: z.string().default('') }))
      .default([]),
    featured: z.boolean().default(true),
    order: z.number().default(100),
    draft: z.boolean().default(false),
    link: z.string().url().optional(),
  }),
});

export const collections = { works, projects };
