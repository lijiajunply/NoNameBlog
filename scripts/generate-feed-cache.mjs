import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://blog.luckyfishes.site";

// ─── XML parsing (mirrors src/lib/content/rss-client.ts) ─────────────────────

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractFirstTag(block, tagNames) {
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

function normalizeXmlText(value, fallback) {
  if (!value) return fallback;
  const text = value
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? decodeXmlEntities(text) : fallback;
}

function decodeXmlEntities(value) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function extractRssLink(block) {
  const tag = extractFirstTag(block, ["link"]);
  if (tag) {
    const normalized = normalizeXmlText(tag, "");
    if (normalized) return normalized;
  }
  return "#";
}

function parseRssItems(xml) {
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

function extractAtomLink(block) {
  const alternate = block.match(
    /<link\b[^>]*rel=["']alternate["'][^>]*href="([^"]+)"[^>]*\/?>/i,
  );
  if (alternate?.[1]) return decodeXmlEntities(alternate[1]);

  const anyHref = block.match(/<link\b[^>]*href="([^"]+)"[^>]*\/?>/i);
  if (anyHref?.[1]) return decodeXmlEntities(anyHref[1]);

  const id = extractFirstTag(block, ["id"]);
  if (id) {
    const normalized = normalizeXmlText(id, "");
    if (normalized.startsWith("http")) return normalized;
  }
  return "#";
}

function parseAtomItems(xml) {
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

function parseFeedAuto(xml) {
  if (/<item\b/i.test(xml)) return parseRssItems(xml);
  if (/<entry\b/i.test(xml)) return parseAtomItems(xml);
  return [];
}

// ─── Feed fetching ────────────────────────────────────────────────────────────

async function fetchXml(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const candidates = [
  { suffix: "feed", parse: parseFeedAuto },
  { suffix: "rss.xml", parse: parseRssItems },
  { suffix: "atom.xml", parse: parseAtomItems },
];

async function fetchFriendItems(friend) {
  for (const { suffix, parse } of candidates) {
    const url = `${friend.url}${suffix}`;
    try {
      const xml = await fetchXml(url);
      const items = parse(xml);
      if (items.length === 0) continue;

      console.log(`  [ok] ${url} (${items.length} items)`);
      return items.map((item) => ({
        ...item,
        name: friend.name,
        avatar: friend.avatar ?? null,
      }));
    } catch (err) {
      console.warn(`  [fail] ${url}: ${err.message}`);
    }
  }
  return [];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const friendsPath = path.join(process.cwd(), "content/friends.json");
const raw = JSON.parse(fs.readFileSync(friendsPath, "utf8"));
const friends = raw
  .filter((f) => f.url !== `${SITE_URL}/`)
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

console.log(`[feed-cache] fetching feeds for ${friends.length} friends...`);

const allItems = [];
for (const friend of friends) {
  console.log(`→ ${friend.name}`);
  const items = await fetchFriendItems(friend);
  allItems.push(...items);
}

const deduped = Array.from(
  new Map(
    allItems.map((item) => {
      const key =
        item.link !== "#" ? item.link : `${item.title}-${item.pubDate}`;
      return [key, item];
    }),
  ).values(),
).sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

const outPath = path.join(process.cwd(), "public/feed-cache.json");
fs.writeFileSync(outPath, JSON.stringify(deduped, null, 2), "utf8");
console.log(`[feed-cache] generated public/feed-cache.json (${deduped.length} items)`);
