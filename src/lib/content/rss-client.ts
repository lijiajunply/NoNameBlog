import type { RssItem } from "@/types/rss";

// ─── Shared utilities ────────────────────────────────────────────────────────

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractFirstTag(
  block: string,
  tagNames: string[],
): string | undefined {
  for (const tagName of tagNames) {
    const match = block.match(
      new RegExp(
        `<${escapeRegExp(tagName)}\\b[^>]*>([\\s\\S]*?)</${escapeRegExp(tagName)}>`,
        "i",
      ),
    );
    if (match?.[1]) return match[1];
  }
  return undefined;
}

function normalizeXmlText(value: string | undefined, fallback: string) {
  if (!value) return fallback;

  const text = value
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text ? decodeXmlEntities(text) : fallback;
}

function decodeXmlEntities(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

async function fetchXml(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

// ─── RSS 2.0 adapter ─────────────────────────────────────────────────────────
// Format: <channel><item>...</item></channel>
// Link:   <link>https://...</link>  (text node)
// Date:   <pubDate>
// Body:   <description>

function extractRssLink(block: string): string {
  const tag = extractFirstTag(block, ["link"]);
  if (tag) {
    const normalized = normalizeXmlText(tag, "");
    if (normalized) return normalized;
  }
  return "#";
}

export function parseRssItems(xml: string): RssItem[] {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  return blocks.map((block) => ({
    title: normalizeXmlText(extractFirstTag(block, ["title"]), "无标题"),
    link: extractRssLink(block),
    description: normalizeXmlText(
      extractFirstTag(block, ["description"]),
      "无描述",
    ),
    pubDate: normalizeXmlText(extractFirstTag(block, ["pubDate"]), "无发布时间"),
  }));
}

export async function readRssFeed(url: string): Promise<RssItem[]> {
  return parseRssItems(await fetchXml(url));
}

// ─── Atom adapter ────────────────────────────────────────────────────────────
// Format: <feed><entry>...</entry></feed>
// Link:   <link href="..." rel="alternate"/>  (attribute)
// Date:   <published> / <updated>
// Body:   <summary> / <content>

function extractAtomLink(block: string): string {
  // prefer rel="alternate"
  const alternate = block.match(
    /<link\b[^>]*rel=["']alternate["'][^>]*href="([^"]+)"[^>]*\/?>/i,
  );
  if (alternate?.[1]) return decodeXmlEntities(alternate[1]);

  const anyHref = block.match(/<link\b[^>]*href="([^"]+)"[^>]*\/?>/i);
  if (anyHref?.[1]) return decodeXmlEntities(anyHref[1]);

  // <id> fallback — only when it looks like an HTTP URL
  const id = extractFirstTag(block, ["id"]);
  if (id) {
    const normalized = normalizeXmlText(id, "");
    if (normalized.startsWith("http")) return normalized;
  }

  return "#";
}

export function parseAtomItems(xml: string): RssItem[] {
  const blocks = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  return blocks.map((block) => ({
    title: normalizeXmlText(extractFirstTag(block, ["title"]), "无标题"),
    link: extractAtomLink(block),
    description: normalizeXmlText(
      extractFirstTag(block, ["summary", "content"]),
      "无描述",
    ),
    pubDate: normalizeXmlText(
      extractFirstTag(block, ["published", "updated"]),
      "无发布时间",
    ),
  }));
}

export async function readAtomFeed(url: string): Promise<RssItem[]> {
  return parseAtomItems(await fetchXml(url));
}

// ─── Auto-detect adapter (for /feed endpoints) ───────────────────────────────
// Checks which block type exists in the response and delegates accordingly.

export function parseFeedAuto(xml: string): RssItem[] {
  if (/<item\b/i.test(xml)) return parseRssItems(xml);
  if (/<entry\b/i.test(xml)) return parseAtomItems(xml);
  return [];
}

export async function readFeedAuto(url: string): Promise<RssItem[]> {
  return parseFeedAuto(await fetchXml(url));
}
