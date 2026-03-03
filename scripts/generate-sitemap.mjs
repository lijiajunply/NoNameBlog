import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const siteUrl = "https://blog.luckyfishes.site";

function getPostSlugs() {
  const dir = path.join(process.cwd(), "content/posts");
  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".mdx"));

  const posts = files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const source = fs.readFileSync(path.join(dir, file), "utf8");
      const { data } = matter(source);
      return {
        slug,
        draft: Boolean(data.draft),
        category: data.category ?? "Uncategorized",
        tags: Array.isArray(data.tags) ? data.tags : [],
      };
    })
    .filter((post) => !post.draft);

  const postRoutes = posts.map((post) => `/posts/${post.slug}/`);
  const tagRoutes = [
    ...new Set(
      posts.flatMap((post) =>
        [post.category, ...post.tags]
          .filter(Boolean)
          .map((tag) => `/tags/${encodeURIComponent(tag)}/`),
      ),
    ),
  ];

  return {
    postRoutes,
    tagRoutes,
  };
}

const staticRoutes = [
  "/",
  "/about/",
  "/friends/",
  "/stats/",
  "/search/",
  "/tags/",
];
const routes = getPostSlugs();
const urls = [
  ...staticRoutes,
  ...routes.postRoutes,
  ...routes.tagRoutes,
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`).join("\n")}
</urlset>`;

fs.writeFileSync(path.join(process.cwd(), "public/sitemap.xml"), xml, "utf8");
console.log("[sitemap] generated public/sitemap.xml");
