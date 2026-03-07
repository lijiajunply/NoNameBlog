import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const site = {
  siteUrl: "https://blog.luckyfishes.site",
  siteName: "NoName Blog",
  description: "一个简约的静态技术博客，记录开发与思考。",
};

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function collectMdxFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMdxFiles(entryPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(entryPath);
    }
  }
  return files;
}

function getPosts() {
  const dir = path.join(process.cwd(), "content/posts");
  const files = collectMdxFiles(dir);
  const slugMap = new Map();

  return files
    .map((filePath) => {
      const slug = path.basename(filePath, ".mdx");
      const existing = slugMap.get(slug);
      if (existing) {
        throw new Error(
          `Duplicate post slug "${slug}" found in "${existing}" and "${filePath}".`,
        );
      }
      slugMap.set(slug, filePath);

      const source = fs.readFileSync(filePath, "utf8");
      const { data } = matter(source);
      return { slug, data };
    })
    .filter((post) => !post.data.draft)
    .sort(
      (a, b) =>
        new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
    );
}

const items = getPosts()
  .map((post) => {
    const url = `${site.siteUrl}/posts/${post.slug}/`;
    const summary = post.data.summary ?? "";
    return `\n      <item>\n        <title>${escapeXml(post.data.title)}</title>\n        <link>${url}</link>\n        <guid>${url}</guid>\n        <pubDate>${new Date(post.data.date).toUTCString()}</pubDate>\n        <description>${escapeXml(summary)}</description>\n      </item>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.siteName)}</title>
    <link>${site.siteUrl}</link>
    <description>${escapeXml(site.description)}</description>${items}
  </channel>
</rss>`;

fs.writeFileSync(path.join(process.cwd(), "public/rss.xml"), xml, "utf8");
console.log("[rss] generated public/rss.xml");
