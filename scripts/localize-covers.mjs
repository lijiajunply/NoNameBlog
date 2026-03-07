import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const postsDir = path.join(process.cwd(), "content/posts");
const coverDir = path.join(process.cwd(), "public/notion-covers");

function sanitizeName(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extFromType(contentType) {
  if (!contentType) return "jpg";
  if (contentType.includes("image/png")) return "png";
  if (contentType.includes("image/webp")) return "webp";
  if (contentType.includes("image/gif")) return "gif";
  if (contentType.includes("image/avif")) return "avif";
  if (contentType.includes("image/svg+xml")) return "svg";
  return "jpg";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function collectMdxFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await collectMdxFiles(entryPath)));
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".mdx")) {
        files.push(entryPath);
      }
    }

    return files;
  } catch {
    return [];
  }
}

function escapeXml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createFallbackSvg(slug) {
  const hash = crypto.createHash("md5").update(slug).digest("hex");
  const hue1 = parseInt(hash.slice(0, 2), 16) % 360;
  const hue2 = (hue1 + 60 + (parseInt(hash.slice(2, 4), 16) % 80)) % 360;
  const label = slug.replaceAll("-", " ").slice(0, 48);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="${escapeXml(
    label,
  )}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue1}, 72%, 45%)" />
      <stop offset="100%" stop-color="hsl(${hue2}, 78%, 35%)" />
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)" />
  <circle cx="1350" cy="220" r="260" fill="rgba(255,255,255,0.09)" />
  <circle cx="280" cy="760" r="210" fill="rgba(255,255,255,0.08)" />
  <text x="120" y="760" fill="rgba(255,255,255,0.92)" font-size="66" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Noto Sans,Arial,sans-serif" letter-spacing="1.2">${escapeXml(
    label,
  )}</text>
</svg>`;
}

async function fetchWithRetry(url, maxAttempts = 5) {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const resp = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
          accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          "cache-control": "no-cache",
          pragma: "no-cache",
        },
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      return resp;
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await sleep(400 * attempt);
      }
    }
  }
  throw lastErr ?? new Error("fetch failed");
}

async function main() {
  await fs.mkdir(coverDir, { recursive: true });
  const files = await collectMdxFiles(postsDir);

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let fallback = 0;
  const slugMap = new Map();

  for (const filePath of files) {
    const slug = path.basename(filePath, ".mdx");
    const existing = slugMap.get(slug);
    if (existing) {
      throw new Error(
        `Duplicate post slug "${slug}" found in "${existing}" and "${filePath}".`,
      );
    }
    slugMap.set(slug, filePath);

    const src = await fs.readFile(filePath, "utf8");
    const parsed = matter(src);
    const cover = parsed.data.cover;

    if (!cover || typeof cover !== "string") {
      skipped += 1;
      continue;
    }
    if (cover.startsWith("/")) {
      skipped += 1;
      continue;
    }

    try {
      const resp = await fetchWithRetry(cover);
      const contentType = resp.headers.get("content-type") || "";
      const ext = extFromType(contentType);
      const baseName = sanitizeName(slug) || "post";
      const localName = `${baseName}.${ext}`;
      const localPath = path.join(coverDir, localName);
      const ab = await resp.arrayBuffer();
      await fs.writeFile(localPath, Buffer.from(ab));

      parsed.data.cover = `/notion-covers/${localName}`;
      const out = matter.stringify(parsed.content, parsed.data);
      await fs.writeFile(filePath, out, "utf8");
      updated += 1;
      console.log(`${slug}: localized -> /notion-covers/${localName}`);
    } catch (err) {
      if (cover.includes("source.unsplash.com/random")) {
        const baseName = sanitizeName(slug) || "post";
        const localName = `${baseName}.svg`;
        const localPath = path.join(coverDir, localName);
        const svg = createFallbackSvg(slug);
        await fs.writeFile(localPath, svg, "utf8");

        parsed.data.cover = `/notion-covers/${localName}`;
        const out = matter.stringify(parsed.content, parsed.data);
        await fs.writeFile(filePath, out, "utf8");
        updated += 1;
        fallback += 1;
        console.log(`${slug}: fallback -> /notion-covers/${localName}`);
      } else {
        failed += 1;
        console.error(`${slug}: failed -> ${err.message}`);
      }
    }
  }

  console.log(
    `done: updated=${updated}, skipped=${skipped}, failed=${failed}, fallback=${fallback}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
