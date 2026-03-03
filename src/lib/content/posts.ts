import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { type PostFrontmatter, postFrontmatterSchema } from "./schema";
import { extractHeadings } from "./toc";

export type Heading = {
  depth: 1 | 2 | 3;
  text: string;
  id: string;
};

export type Post = {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  readingTime: string;
  headings: Heading[];
};

export type MonthlyGrowthStat = {
  date: string;
  posts: number;
  tags: number;
};

const postsDir = path.join(process.cwd(), "content/posts");
const aboutPath = path.join(process.cwd(), "content/pages/about.mdx");

function getPostSlugs() {
  if (!fs.existsSync(postsDir)) {
    return [];
  }

  return fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

function readPostFile(slug: string): Post {
  const fullPath = path.join(postsDir, `${slug}.mdx`);
  const source = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(source);
  const frontmatter = postFrontmatterSchema.parse(data);

  return {
    slug,
    frontmatter,
    content,
    readingTime: readingTime(content).text,
    headings: extractHeadings(content),
  };
}

function sortPosts(posts: Post[]) {
  return posts.toSorted(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime(),
  );
}

export function getAllPosts(options?: { includeDrafts?: boolean }) {
  const includeDrafts = options?.includeDrafts ?? false;

  const posts = getPostSlugs().map(readPostFile);
  const visiblePosts = includeDrafts
    ? posts
    : posts.filter((post) => !post.frontmatter.draft);

  return sortPosts(visiblePosts);
}

export function getPostBySlug(slug: string) {
  const postPath = path.join(postsDir, `${slug}.mdx`);
  if (!fs.existsSync(postPath)) {
    return null;
  }

  const post = readPostFile(slug);
  if (post.frontmatter.draft && process.env.NODE_ENV === "production") {
    return null;
  }

  return post;
}

export function getAllTags() {
  const map = new Map<string, number>();

  for (const post of getAllPosts()) {
    for (const tag of post.frontmatter.tags) {
      if (tag) {
        map.set(tag, (map.get(tag) ?? 0) + 1);
      }
    }
  }

  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .toSorted((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getAllCategories() {
  const map = new Map<string, number>();

  for (const post of getAllPosts()) {
    const category = post.frontmatter.category;
    if (category) {
      map.set(category, (map.get(category) ?? 0) + 1);
    }
  }

  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .toSorted((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getPostsByTag(tag: string) {
  return getAllPosts().filter((post) => post.frontmatter.tags.includes(tag));
}

export function getPostsByCategory(category: string) {
  return getAllPosts().filter((post) => post.frontmatter.category === category);
}

type YearMonth = {
  year: number;
  month: number;
};

function parseYearMonth(date: string): YearMonth {
  const [year, month] = date.split("-", 2).map(Number);
  return { year, month };
}

function compareYearMonth(a: YearMonth, b: YearMonth) {
  if (a.year !== b.year) {
    return a.year - b.year;
  }
  return a.month - b.month;
}

function nextYearMonth({ year, month }: YearMonth): YearMonth {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

function formatMonthStart({ year, month }: YearMonth) {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-01`;
}

export function getMonthlyGrowthStats(): MonthlyGrowthStat[] {
  const posts = getAllPosts().toSorted((a, b) =>
    a.frontmatter.date.localeCompare(b.frontmatter.date),
  );
  if (posts.length === 0) {
    return [];
  }

  const postsByMonth = new Map<string, Post[]>();
  for (const post of posts) {
    const monthKey = `${post.frontmatter.date.slice(0, 7)}-01`;
    const current = postsByMonth.get(monthKey);
    if (current) {
      current.push(post);
    } else {
      postsByMonth.set(monthKey, [post]);
    }
  }

  const firstMonth = parseYearMonth(posts[0].frontmatter.date);
  const now = new Date();
  const currentMonth: YearMonth = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };

  const firstSeenTagMonth = new Map<string, string>();
  for (const post of posts) {
    const monthKey = `${post.frontmatter.date.slice(0, 7)}-01`;
    for (const tag of post.frontmatter.tags) {
      if (tag && !firstSeenTagMonth.has(tag)) {
        firstSeenTagMonth.set(tag, monthKey);
      }
    }
  }

  const newTagsByMonth = new Map<string, number>();
  for (const monthKey of firstSeenTagMonth.values()) {
    newTagsByMonth.set(monthKey, (newTagsByMonth.get(monthKey) ?? 0) + 1);
  }

  const stats: MonthlyGrowthStat[] = [];
  let cursor = firstMonth;

  while (compareYearMonth(cursor, currentMonth) <= 0) {
    const monthKey = formatMonthStart(cursor);
    const monthPosts = postsByMonth.get(monthKey) ?? [];

    stats.push({
      date: monthKey,
      posts: monthPosts.length,
      tags: newTagsByMonth.get(monthKey) ?? 0,
    });
    cursor = nextYearMonth(cursor);
  }

  return stats;
}

export function getAboutPageSource() {
  if (!fs.existsSync(aboutPath)) {
    return "# About\n\n欢迎来到我的博客。";
  }

  return fs.readFileSync(aboutPath, "utf8");
}
