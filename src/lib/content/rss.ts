import fs from "node:fs";
import path from "node:path";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "./posts";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function generateRssXml() {
  const posts = getAllPosts();
  const items = posts
    .map((post) => {
      const url = `${siteConfig.siteUrl}/posts/${post.slug}/`;
      const summary = post.frontmatter.summary ?? "";
      return `\n      <item>\n        <title>${escapeXml(post.frontmatter.title)}</title>\n        <link>${url}</link>\n        <guid>${url}</guid>\n        <pubDate>${new Date(post.frontmatter.date).toUTCString()}</pubDate>\n        <description>${escapeXml(summary)}</description>\n      </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteConfig.siteName)}</title>
    <link>${siteConfig.siteUrl}</link>
    <description>${escapeXml(siteConfig.description)}</description>${items}
  </channel>
</rss>`;
}

export function writeRssXml() {
  const xml = generateRssXml();
  const target = path.join(process.cwd(), "public/rss.xml");
  fs.writeFileSync(target, xml, "utf8");
}