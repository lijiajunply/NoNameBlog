import fs from "node:fs";
import path from "node:path";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "./posts";

export type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

function decodeXmlEntities(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function normalizeXmlText(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  const text = value
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text ? decodeXmlEntities(text) : fallback;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractFirstTag(block: string, tagNames: string[]) {
  for (const tagName of tagNames) {
    const match = block.match(
      new RegExp(
        `<${escapeRegExp(tagName)}\\b[^>]*>([\\s\\S]*?)</${escapeRegExp(tagName)}>`,
        "i",
      ),
    );

    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

function extractLink(block: string) {
  const xmlLink = extractFirstTag(block, ["link", "id"]);
  if (xmlLink) {
    const normalized = normalizeXmlText(xmlLink, "");
    if (normalized) {
      return normalized;
    }
  }

  const hrefMatch = block.match(/<link\b[^>]*href="([^"]+)"[^>]*\/?>/i);
  if (hrefMatch?.[1]) {
    return decodeXmlEntities(hrefMatch[1]);
  }

  return "#";
}

function parseFeedItems(xml: string) {
  const rssItems = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  const atomItems = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  const itemBlocks = rssItems.length > 0 ? rssItems : atomItems;

  return itemBlocks.map((block) => ({
    title: normalizeXmlText(extractFirstTag(block, ["title"]), "无标题"),
    link: extractLink(block),
    description: normalizeXmlText(
      extractFirstTag(block, ["description", "summary", "content"]),
      "无描述",
    ),
    pubDate: normalizeXmlText(
      extractFirstTag(block, ["pubDate", "published", "updated"]),
      "无发布时间",
    ),
  }));
}

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

export async function readRssXml(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP请求失败: ${response.status}`);
  }

  const xml = await response.text();
  return parseFeedItems(xml);
}
