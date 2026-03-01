import { z } from "zod";

export const postFrontmatterSchema = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  summary: z.string().min(1),
  tags: z.array(z.string()).default([]),
  category: z.string().default("Uncategorized"),
  draft: z.boolean().default(false),
  cover: z.string().optional(),
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export const friendSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  description: z.string().min(1),
  avatar: z.string().optional(),
  order: z.number().int().optional(),
  category: z.string().default("其他"),
});

export type Friend = z.infer<typeof friendSchema>;
