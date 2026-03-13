import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const postsDir = path.join(process.cwd(), "content/posts");

export function getPostsDir() {
  return postsDir;
}

export function collectPostFiles(dir = postsDir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectPostFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(entryPath);
    }
  }

  return files;
}

export function getPostEntries() {
  const entries = new Map();

  for (const filePath of collectPostFiles()) {
    const slug = path.basename(filePath, ".mdx");
    const existingPath = entries.get(slug);
    if (existingPath) {
      throw new Error(
        `Duplicate post slug "${slug}" found in "${existingPath}" and "${filePath}".`,
      );
    }
    entries.set(slug, filePath);
  }

  return [...entries.entries()].map(([slug, filePath]) => ({ slug, filePath }));
}

export function readPostFrontmatters() {
  return getPostEntries().map((entry) => {
    const source = fs.readFileSync(entry.filePath, "utf8");
    const { data } = matter(source);
    return { slug: entry.slug, filePath: entry.filePath, data };
  });
}

function countByName(values) {
  const counts = new Map();

  for (const value of values) {
    const name = String(value || "").trim();
    if (!name) {
      continue;
    }

    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .toSorted((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getCategoryStats() {
  return countByName(
    readPostFrontmatters().map((post) => post.data.category ?? "Uncategorized"),
  );
}

export function getTagStats() {
  return countByName(
    readPostFrontmatters().flatMap((post) =>
      Array.isArray(post.data.tags) ? post.data.tags : [],
    ),
  );
}

export function slugExists(slug) {
  return getPostEntries().some((entry) => entry.slug === slug);
}

export function slugToFilePath(slug) {
  return path.join(postsDir, `${slug}.mdx`);
}

export function slugifyTitle(input) {
  const normalized = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized;
}

export function normalizeDate(input) {
  const value = String(input || "").trim();
  if (!value) {
    return "";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid date "${value}". Expected YYYY-MM-DD.`);
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date "${value}".`);
  }

  return value;
}

export function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function escapeYamlDoubleQuoted(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function stringifyYamlString(value) {
  return `"${escapeYamlDoubleQuoted(value)}"`;
}

export function createPostTemplate({
  title,
  date,
  summary,
  tags,
  category,
  draft,
}) {
  const lines = [
    "---",
    `title: ${stringifyYamlString(title)}`,
    `date: '${date}'`,
    `summary: ${stringifyYamlString(summary)}`,
  ];

  if (tags.length === 0) {
    lines.push("tags: []");
  } else {
    lines.push("tags:");
    for (const tag of tags) {
      lines.push(`  - ${stringifyYamlString(tag)}`);
    }
  }

  lines.push(`category: ${stringifyYamlString(category)}`);
  lines.push(`draft: ${draft ? "true" : "false"}`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${title}`);
  lines.push("");

  return `${lines.join("\n")}`;
}

export function parseTagInput(input, tagStats) {
  if (!input.trim()) {
    return [];
  }

  const tagOptions = tagStats.map((tag) => tag.name);
  const values = input
    .split(/[,，]/)
    .map((token) => token.trim())
    .filter(Boolean);

  const selected = [];
  for (const value of values) {
    if (/^\d+$/.test(value)) {
      const index = Number(value) - 1;
      if (index < 0 || index >= tagOptions.length) {
        throw new Error(`Unknown tag index "${value}".`);
      }
      selected.push(tagOptions[index]);
      continue;
    }

    selected.push(value);
  }

  return [...new Set(selected)];
}

export function parseCategoryInput(input, categoryStats) {
  const value = input.trim();
  if (!value) {
    return "Uncategorized";
  }

  if (/^\d+$/.test(value)) {
    const index = Number(value) - 1;
    if (index < 0 || index >= categoryStats.length) {
      throw new Error(`Unknown category index "${value}".`);
    }
    return categoryStats[index].name;
  }

  return value;
}

export function parseBooleanFlag(value, fallback = true) {
  if (value == null) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value "${value}".`);
}

export function ensurePostsDir() {
  fs.mkdirSync(postsDir, { recursive: true });
}

export function writePostFile(slug, content) {
  ensurePostsDir();
  fs.writeFileSync(slugToFilePath(slug), content, "utf8");
}
