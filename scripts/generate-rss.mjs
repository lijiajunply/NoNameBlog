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

function getPosts() {
  const dir = path.join(process.cwd(), "content/posts");
  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".mdx"));

  return files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const source = fs.readFileSync(path.join(dir, file), "utf8");
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
    return `\n      <item>\n        <title>${escapeXml(post.data.title)}</title>\n        <link>${url}</link>\n        <guid>${url}</guid>\n        <pubDate>${new Date(post.data.date).toUTCString()}</pubDate>\n        <description>${escapeXml(post.data.summary)}</description>\n      </item>`;
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
