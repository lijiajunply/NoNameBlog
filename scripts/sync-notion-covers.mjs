import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const NOTION_API_BASE = "https://www.notion.so/api/v3";
const postsDir = path.join(process.cwd(), "content/posts");

const slugToPageId = {
  "avalonia-1-start": "4f87c0a5-1499-4136-a270-ecb1c3145034",
  "python-2level-start": "683c405b-1e78-44b1-9cd7-5b0fa5ce76b9",
  "python-2level-1": "70f3fec3-8b68-4ef5-a5f3-d7c1c2858719",
  "python-2level-2": "a059b36b-f873-4f64-9e8d-199c2657707e",
  "python-2level-3": "0ffda733-3348-4779-99ba-d586697be256",
  "python-2level-4": "95f3c68a-d698-4897-ad77-4335896f0a57",
  "python-2level-6": "1e0aaa72-a9bb-43a6-94f9-46887dd5d314",
  "linux-guide-ubuntu": "2b9ce026-debd-40a6-9566-b4783af7c51e",
  "linux-guide-debian": "e85184a7-4d88-4f0a-a3ca-738a69225786",
  "arch-should-be-your-productivity-tool":
    "25eaa8e8-95fa-494d-a770-1f91bd8cae54",
  "python-from-entry-to-burial": "776ec947-9fe1-4bba-bb60-6ff0b60cb794",
  "generate-character-drawing-from-a-picture":
    "404dbfcb-284c-4554-b80f-86cf3c4fb1de",
  "authentication-asp-net-core": "67f67561-3138-4824-84dd-d22407b311f9",
  "csharp-learn-1": "5c5549a9-03dd-45b2-9c81-d9c6db05ca03",
  "avalonia-2-initproj": "363947b9-8a66-4b55-ab33-f54674a8cdbb",
  "avalonia-3-practice-calculator": "b9606f54-149b-498d-9cc8-98633e3cf2a6",
  "avalonia-4-mvvmpractice-fileviewer": "c6b940d0-ac22-48c7-8a91-b4425fa46ddd",
  "avalonia-5-fluenttodo": "42c9617d-ecc5-487e-a2aa-8688482b709a",
  "characteristics-of-various-sorting": "2476711b-3148-805e-ae07-e9840d52fe6c",
  "cs-sql": "95980452-94d2-4d04-9331-9b412b69de68",
  "datastructure-1-factorypattern": "b2730290-4760-46cf-87ab-685dc8ab8a0b",
  "datastructure-2": "2476711b-3148-809f-9179-ec7a53e158f1",
  "datastructure-3": "2476711b-3148-803f-ae2b-f0c76de3807f",
  "datastructure-4": "2476711b-3148-8084-adc1-f3d60aa5913a",
  "datastructure-5": "2486711b-3148-80ad-b758-e2fecf2c2af0",
  "dotnet-9-crash": "1ab6711b-3148-80a4-83fe-e73ddbfd13ef",
  "efcore-error": "5e091d30-a97d-4485-8969-402f43e6e000",
  float1: "1a76711b-3148-803e-9f48-f9d2a2a3f85c",
  "how-to-windows": "1a36711b-3148-800e-9bf5-d8e4044496cc",
  "linux-guide-arch": "d6c6b73f-b328-409e-8602-49fdfd84e65a",
  "logto-csharp": "1066711b-3148-80d9-99fb-f33e0ce833e0",
  "luckylang-4-astrun": "a6ee4740-8af7-4d72-8079-dea1b503f77b",
  "md-site-use": "1426711b-3148-80fa-8cce-c0050369114c",
  "md-start": "1076711b-3148-805c-a525-e8334ee27ec7",
  "plugin-recommendations": "1426711b-3148-8045-9ad2-f4c7000e2ba6",
  "python-2level-4.5": "6cbbe650-1249-425f-9413-ad087bf8b305",
  "python-2level-5": "0e5c5f24-3a65-4c69-a85d-d39c8af84b6a",
  "social-darwinism": "436f53df-a372-4a1b-bfeb-83780780cbe1",
  "xauat-1": "bddbce13-7431-4319-9169-d81e2bbab5db",
};

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

function normalizeCover(rawCover) {
  if (!rawCover) return "";
  if (rawCover.startsWith("/")) return `https://www.notion.so${rawCover}`;
  return rawCover;
}

function buildFrontmatter(data, cover) {
  const out = {
    title: data.title ?? "",
    date: data.date ?? "2021-07-02",
    summary: data.summary ?? "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    category: data.category ?? "Uncategorized",
  };
  if (data.draft === true) out.draft = true;
  if (cover) out.cover = cover;
  return out;
}

async function syncOne(slug, pageId) {
  const filePath = path.join(postsDir, `${slug}.mdx`);
  const source = await fs.readFile(filePath, "utf8");
  const parsed = matter(source);

  const sync = await notionPost("syncRecordValues", {
    requests: [
      {
        pointer: { id: pageId, table: "block" },
        version: -1,
      },
    ],
  });
  const rawCover =
    sync?.recordMap?.block?.[pageId]?.value?.format?.page_cover || "";
  const cover = normalizeCover(rawCover);

  const nextData = buildFrontmatter(parsed.data, cover);
  const out = matter.stringify(parsed.content, nextData);
  await fs.writeFile(filePath, out, "utf8");
  return { slug, cover };
}

async function main() {
  const entries = Object.entries(slugToPageId);
  const results = [];
  const withoutCover = [];

  for (const [slug, pageId] of entries) {
    try {
      const result = await syncOne(slug, pageId);
      results.push(result);
      if (!result.cover) withoutCover.push(slug);
      console.log(
        `${slug}: ${result.cover ? "cover synced" : "no cover in notion"}`,
      );
    } catch (err) {
      console.error(`${slug}: failed -> ${err.message}`);
    }
  }

  console.log(`\nDone: ${results.length} files updated`);
  if (withoutCover.length > 0) {
    console.log(
      `No cover in notion (${withoutCover.length}): ${withoutCover.join(", ")}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
