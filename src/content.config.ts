import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).min(1),
    href: z.string().url(),
    repo: z.string().url().optional(),
    order: z.number().int().nonnegative(),
    featured: z.boolean().default(true),
    // A real source string and the shipped Korean translation, shown as the project's proof.
    specimen: z
      .object({
        source: z.string(),
        target: z.string(),
        note: z.string()
      })
      .optional()
  })
});

export const collections = {
  projects
};
