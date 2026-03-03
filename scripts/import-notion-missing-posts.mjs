import fs from "node:fs/promises";
import path from "node:path";

const NOTION_API_BASE = "https://www.notion.so/api/v3";

const PAGE_IDS = [
  "4f87c0a5-1499-4136-a270-ecb1c3145034", // Avalonia-1-Start
  "683c405b-1e78-44b1-9cd7-5b0fa5ce76b9", // Python-2Level-Start
  "70f3fec3-8b68-4ef5-a5f3-d7c1c2858719", // Python-2Level-1
  "a059b36b-f873-4f64-9e8d-199c2657707e", // Python-2Level-2
  "0ffda733-3348-4779-99ba-d586697be256", // Python-2Level-3
  "95f3c68a-d698-4897-ad77-4335896f0a57", // Python-2Level-4
  "1e0aaa72-a9bb-43a6-94f9-46887dd5d314", // Python-2Level-6
  "2b9ce026-debd-40a6-9566-b4783af7c51e", // linux-guide-ubuntu
  "e85184a7-4d88-4f0a-a3ca-738a69225786", // linux-guide-debian
  "25eaa8e8-95fa-494d-a770-1f91bd8cae54", // arch-should-be-your-productivity-tool
  "776ec947-9fe1-4bba-bb60-6ff0b60cb794", // python-from-entry-to-burial
  "404dbfcb-284c-4554-b80f-86cf3c4fb1de", // generate-character-drawing-from-a-picture
  "67f67561-3138-4824-84dd-d22407b311f9", // authentication-asp-net-core
  "5c5549a9-03dd-45b2-9c81-d9c6db05ca03", // csharp-learn-1
];

const postsDir = path.join(process.cwd(), "content/posts");

async function notionPost(endpoint, body) {
  const resp = await fetch(`${NOTION_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    throw new Error(`Notion API ${endpoint} failed: ${resp.status}`);
  }
  return await resp.json();
}

function noDash(id) {
  return id.replaceAll("-", "");
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function extractDecoratedText(segments, blockMap) {
  const pieces = [];
  for (const seg of ensureArray(segments)) {
    let text = String(seg?.[0] ?? "");
    const decos = ensureArray(seg?.[1]);
    if (text === "‣" && decos.length > 0) {
      const first = decos[0];
      if (first?.[0] === "d" && first?.[1]?.start_date) {
        text = first[1].start_date;
      } else if (first?.[0] === "p" && first?.[1]) {
        const id = first[1];
        const block = blockMap.get(id)?.value;
        const rawTitle = extractDecoratedText(
          block?.properties?.title ?? [["Untitled"]],
          blockMap,
        );
        text = `[${rawTitle || "Link"}](https://www.notion.so/${noDash(id)})`;
      }
    }

    for (const deco of decos) {
      const t = deco?.[0];
      if (t === "a" && deco?.[1] && !text.startsWith("[")) {
        text = `[${text}](${deco[1]})`;
      }
      if (t === "b") text = `**${text}**`;
      if (t === "i") text = `*${text}*`;
      if (t === "s") text = `~~${text}~~`;
      if (t === "c") text = `\`${text}\``;
      if (t === "_") text = `<u>${text}</u>`;
    }
    pieces.push(text);
  }
  return pieces.join("");
}

function getPropertyBySchemaName(block, schema, name, blockMap) {
  const key = Object.entries(schema).find(([, v]) => v?.name === name)?.[0];
  if (!key) return "";
  return extractDecoratedText(block?.properties?.[key], blockMap).trim();
}

function getDateProperty(block, schema, name) {
  const key = Object.entries(schema).find(([, v]) => v?.name === name)?.[0];
  if (!key) return "";
  const first = block?.properties?.[key]?.[0]?.[1]?.[0];
  if (first?.[0] === "d" && first?.[1]?.start_date) {
    return first[1].start_date;
  }
  return "";
}

function normalizeSlug(slug, title, id) {
  const s = String(slug || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "-");
  if (s) return s;
  const t = String(title || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return t || `post-${id.slice(0, 8)}`;
}

function quoteYaml(s) {
  return `"${String(s ?? "").replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`;
}

function cleanInlineMarkdownText(s) {
  return String(s || "")
    .replace(/\*\*/g, "")
    .replace(/__+/g, "")
    .trim();
}

function asTagArray(tags) {
  if (!tags) return [];
  return tags
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function quoteBlock(text, indent = "") {
  const lines = String(text || "").split("\n");
  return lines.map((line) => `${indent}> ${line}`).join("\n");
}

function getBlockText(block, blockMap) {
  return extractDecoratedText(block?.value?.properties?.title, blockMap).trim();
}

function getCodeLanguage(block) {
  const lang = block?.value?.properties?.language?.[0]?.[0];
  return String(lang || "").trim().toLowerCase();
}

function getImageSource(block) {
  const v = block?.value;
  const p = v?.properties;
  return (
    p?.source?.[0]?.[0] ||
    p?.caption?.[0]?.[0] ||
    v?.format?.display_source ||
    v?.format?.source ||
    ""
  );
}

function renderBlocks(ids, blockMap, indent = "") {
  const out = [];
  for (const id of ensureArray(ids)) {
    const block = blockMap.get(id);
    if (!block?.value) continue;
    const v = block.value;
    const text = getBlockText(block, blockMap);
    const children = ensureArray(v.content);

    if (v.type === "header") out.push(`${indent}# ${text}`);
    else if (v.type === "sub_header") out.push(`${indent}## ${text}`);
    else if (v.type === "sub_sub_header") out.push(`${indent}### ${text}`);
    else if (v.type === "text") out.push(`${indent}${text}`);
    else if (v.type === "quote") out.push(quoteBlock(text, indent));
    else if (v.type === "bulleted_list") out.push(`${indent}- ${text}`);
    else if (v.type === "numbered_list") out.push(`${indent}1. ${text}`);
    else if (v.type === "to_do") {
      const checked = Boolean(v.properties?.checked?.[0]?.[0] === "Yes");
      out.push(`${indent}- [${checked ? "x" : " "}] ${text}`);
    } else if (v.type === "code") {
      const lang = getCodeLanguage(block);
      out.push(`${indent}\`\`\`${lang}`);
      out.push(text);
      out.push(`${indent}\`\`\``);
    } else if (v.type === "image") {
      const src = getImageSource(block);
      if (src) out.push(`${indent}![](${src})`);
    } else if (v.type === "divider") {
      out.push(`${indent}---`);
    } else if (v.type === "bookmark") {
      const src = v.properties?.link?.[0]?.[0] || text;
      if (src) out.push(`${indent}[${text || src}](${src})`);
    } else if (v.type === "callout") {
      if (text) out.push(`${indent}> ${text}`);
    } else if (v.type === "equation") {
      const latex = v.properties?.title?.[0]?.[0] || "";
      if (latex) out.push(`${indent}$$${latex}$$`);
    } else if (v.type === "toggle") {
      out.push(`${indent}<details>`);
      out.push(`${indent}<summary>${text || "Details"}</summary>`);
      if (children.length > 0) {
        out.push("");
        out.push(renderBlocks(children, blockMap, indent).trimEnd());
      }
      out.push(`${indent}</details>`);
    } else if (v.type === "page") {
      continue;
    } else {
      if (text) out.push(`${indent}${text}`);
    }

    if (children.length > 0 && v.type === "quote") {
      const childBody = renderBlocks(children, blockMap, indent).trimEnd();
      if (childBody) out.push(quoteBlock(childBody, indent));
    } else if (children.length > 0 && !["toggle"].includes(v.type)) {
      const nextIndent =
        v.type === "bulleted_list" || v.type === "numbered_list" || v.type === "to_do"
          ? `${indent}  `
          : indent;
      const childBody = renderBlocks(children, blockMap, nextIndent).trimEnd();
      if (childBody) out.push(childBody);
    }
    out.push("");
  }
  return out.join("\n");
}

async function fetchBlockTree(rootId) {
  const blockMap = new Map();
  const pending = [rootId];
  const seen = new Set();

  while (pending.length > 0) {
    const batch = [];
    while (pending.length > 0 && batch.length < 64) {
      const id = pending.shift();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      batch.push(id);
    }
    if (batch.length === 0) continue;

    const data = await notionPost("syncRecordValues", {
      requests: batch.map((id) => ({
        pointer: { id, table: "block" },
        version: -1,
      })),
    });
    const blocks = data?.recordMap?.block ?? {};
    for (const [id, raw] of Object.entries(blocks)) {
      blockMap.set(id, raw);
      const children = ensureArray(raw?.value?.content);
      for (const childId of children) {
        if (!seen.has(childId)) pending.push(childId);
      }
    }
  }
  return blockMap;
}

async function exportOne(pageId) {
  const publicData = await notionPost("getPublicPageData", { blockId: pageId });
  const schema = publicData?.collectionSchema ?? {};
  const blockMap = await fetchBlockTree(pageId);
  const page = blockMap.get(pageId)?.value;
  if (!page) throw new Error(`No page block found for ${pageId}`);

  const titleRaw = getPropertyBySchemaName(page, schema, "title", blockMap) || "Untitled";
  const title = cleanInlineMarkdownText(titleRaw) || "Untitled";
  const slugRaw = getPropertyBySchemaName(page, schema, "slug", blockMap);
  const date = getDateProperty(page, schema, "date") || "2021-07-02";
  const summaryRaw =
    getPropertyBySchemaName(page, schema, "summary", blockMap) || `${title}（Notion 导入）`;
  const summary = cleanInlineMarkdownText(summaryRaw) || `${title}（Notion 导入）`;
  const categoryRaw =
    getPropertyBySchemaName(page, schema, "category", blockMap) || "Uncategorized";
  const category = cleanInlineMarkdownText(categoryRaw) || "Uncategorized";
  const tags = asTagArray(getPropertyBySchemaName(page, schema, "tags", blockMap));
  const status = getPropertyBySchemaName(page, schema, "status", blockMap);
  let cover = page?.format?.page_cover || "";
  if (cover.startsWith("/")) {
    cover = `https://www.notion.so${cover}`;
  }
  const draft = status && status !== "Published";
  const slug = normalizeSlug(slugRaw, title, pageId);

  const body = renderBlocks(page.content, blockMap).trim();

  const lines = [
    "---",
    `title: ${quoteYaml(title)}`,
    `date: ${quoteYaml(date)}`,
    `summary: ${quoteYaml(summary)}`,
    `tags: [${tags.map(quoteYaml).join(", ")}]`,
    `category: ${quoteYaml(category)}`,
  ];
  if (draft) lines.push("draft: true");
  if (cover) lines.push(`cover: ${quoteYaml(cover)}`);
  lines.push("---", "", body, "");

  const outPath = path.join(postsDir, `${slug}.mdx`);
  await fs.writeFile(outPath, lines.join("\n"), "utf8");
  return { pageId, title, slug, outPath };
}

async function main() {
  await fs.mkdir(postsDir, { recursive: true });
  const results = [];
  for (const pageId of PAGE_IDS) {
    const result = await exportOne(pageId);
    results.push(result);
    console.log(`exported: ${result.slug} <- ${result.title}`);
  }
  console.log(`done: ${results.length} files`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
