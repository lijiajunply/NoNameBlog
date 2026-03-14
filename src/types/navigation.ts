import type { PostFrontmatter } from "./content";

export type BreadcrumbPostMeta = Pick<PostFrontmatter, "title" | "category"> & {
  slug: string;
};
