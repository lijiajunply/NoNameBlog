import fs from "node:fs";
import path from "node:path";
import { siteConfig } from "@/config/site";
import { getAllCategories, getAllPosts, getAllTags } from "./posts";

const POSTS_PER_PAGE = 8;

function toUrl(loc: string) {
  return `  <url><loc>${loc}</loc></url>`;
}

export function generateSitemapXml() {
  const staticPages = [
    "",
    "/about",
    "/friends",
    "/stats",
    "/search",
  ];
  const posts = getAllPosts();
  const postPages = posts.map((post) => `/posts/${post.slug}`);
  const tagPages = getAllTags().map(
    (tag) => `/tags/${encodeURIComponent(tag.name)}`,
  );
  const categoryPages = getAllCategories().map(
    (category) => `/categories/${encodeURIComponent(category.name)}`,
  );
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const paginationPages =
    totalPages > 1
      ? Array.from({ length: totalPages - 1 }, (_, index) => `/page/${index + 2}`)
      : [];

  const urls = [
    ...staticPages,
    ...paginationPages,
    ...postPages,
    ...tagPages,
    ...categoryPages,
  ]
    .map((route) => `${siteConfig.siteUrl}${route}/`)
    .map(toUrl)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function writeSitemapXml() {
  const xml = generateSitemapXml();
  const target = path.join(process.cwd(), "public/sitemap.xml");
  fs.writeFileSync(target, xml, "utf8");
}
