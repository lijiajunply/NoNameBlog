import type { z } from "zod";
import type { friendSchema, postFrontmatterSchema } from "@/lib/content/schema";

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export type Friend = z.infer<typeof friendSchema>;

export type PostHeading = {
  depth: 1 | 2 | 3;
  text: string;
  id: string;
};

export type Post = {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  readingTime: string;
  headings: PostHeading[];
};

export type MonthlyCumulativeStat = {
  date: string;
  posts: number;
  tags: number;
};

export type PostSummary = Pick<Post, "slug" | "readingTime"> & {
  frontmatter: Pick<
    PostFrontmatter,
    "title" | "date" | "summary" | "category" | "tags" | "cover"
  >;
};
