import type { RssItem } from "@/types/rss";

export async function readRssXml(url: string): Promise<RssItem[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP请求失败: ${response.status}`);
  }

  const xml = await response.text();
  return parseFeedItems(xml);
}

export function parseFeedItems(xml: string): RssItem[] {
  const rssItems = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  const atomItems = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  const itemBlocks = rssItems.length > 0 ? rssItems : atomItems;

  return itemBlocks.map(
    (block) =>
      ({
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
      }) as RssItem,
  );
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

    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

function extractLink(block: string): string {
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

function decodeXmlEntities(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}
