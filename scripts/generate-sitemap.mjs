import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const siteUrl = "https://blog.luckyfishes.site";
const POSTS_PER_PAGE = 8;

function getVisiblePosts() {
  const dir = path.join(process.cwd(), "content/posts");
  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".mdx"));

  return files
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
}

const staticRoutes = [
  "/",
  "/about/",
  "/friends/",
  "/stats/",
  "/search/",
];
const posts = getVisiblePosts();
const postRoutes = posts.map((post) => `/posts/${post.slug}/`);
const tagRoutes = [
  ...new Set(
    posts.flatMap((post) =>
      post.tags.filter(Boolean).map((tag) => `/tags/${encodeURIComponent(tag)}/`),
    ),
  ),
];
const categoryRoutes = [
  ...new Set(
    posts
      .map((post) => post.category)
      .filter(Boolean)
      .map((category) => `/categories/${encodeURIComponent(category)}/`),
  ),
];
const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
const paginationRoutes =
  totalPages > 1
    ? Array.from({ length: totalPages - 1 }, (_, index) => `/page/${index + 2}/`)
    : [];

const urls = [
  ...staticRoutes,
  ...paginationRoutes,
  ...postRoutes,
  ...tagRoutes,
  ...categoryRoutes,
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`).join("\n")}
</urlset>`;

fs.writeFileSync(path.join(process.cwd(), "public/sitemap.xml"), xml, "utf8");
console.log("[sitemap] generated public/sitemap.xml");
