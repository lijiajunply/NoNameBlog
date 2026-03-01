import fs from "node:fs";
import path from "node:path";
import { siteConfig } from "@/config/site";
import { getAllCategories, getAllPosts, getAllTags } from "./posts";

function toUrl(loc: string) {
  return `  <url><loc>${loc}</loc></url>`;
}

export function generateSitemapXml() {
  const staticPages = [
    "",
    "/about",
    "/friends",
    "/search",
    "/categories",
    "/tags",
  ];
  const postPages = getAllPosts().map((post) => `/posts/${post.slug}`);
  const categoryPages = getAllCategories().map(
    (category) => `/categories/${encodeURIComponent(category.name)}`,
  );
  const tagPages = getAllTags().map(
    (tag) => `/tags/${encodeURIComponent(tag.name)}`,
  );

  const urls = [...staticPages, ...postPages, ...categoryPages, ...tagPages]
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
