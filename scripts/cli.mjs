#!/usr/bin/env node

import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import {
  createPostTemplate,
  getCategoryStats,
  getPostsDir,
  getTagStats,
  normalizeDate,
  parseBooleanFlag,
  parseCategoryInput,
  parseTagInput,
  slugExists,
  slugifyTitle,
  slugToFilePath,
  todayString,
  writePostFile,
} from "./lib/content-cli.mjs";

function printHelp() {
  console.log(`Blog CLI

Usage:
  pnpm cli <command> [options]

Commands:
  new           Create a new post interactively
  categories    List categories with post counts
  tags          List tags with post counts
  help          Show this help message

Options for "new":
  --title <text>
  --slug <text>
  --date <YYYY-MM-DD>
  --summary <text>
  --category <text>
  --tags <a,b,c>
  --draft
  --published

Examples:
  pnpm cli new
  pnpm cli new --title "My Post" --category "技术" --tags "开发,CSharp"
  pnpm cli categories
  pnpm cli tags`);
}

function parseArgs(argv) {
  const positionals = [];
  const flags = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const key = token.slice(2);
    if (key === "draft" || key === "published") {
      flags[key] = true;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for --${key}.`);
    }

    flags[key] = next;
    index += 1;
  }

  return { positionals, flags };
}

function printStats(title, stats) {
  console.log(title);
  if (stats.length === 0) {
    console.log("  (empty)");
    return;
  }

  for (const [index, item] of stats.entries()) {
    console.log(
      `${String(index + 1).padStart(2, " ")}. ${item.name} (${item.count})`,
    );
  }
}

async function promptWithDefault(rl, label, defaultValue = "") {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const answer = await rl.question(`${label}${suffix}: `);
  const value = answer.trim();
  return value || defaultValue;
}

async function promptForTitle(rl) {
  while (true) {
    const title = (await rl.question("Title: ")).trim();
    if (title) {
      return title;
    }
    console.log("Title is required.");
  }
}

async function promptForSlug(rl, initialSlug) {
  let candidate = initialSlug;

  while (true) {
    const suggested = candidate || "post-slug";
    const answer = await rl.question(`Slug [${suggested}]: `);
    const nextSlug = (answer.trim() || suggested).toLowerCase();
    const normalized = slugifyTitle(nextSlug);

    if (!normalized) {
      console.log("Slug cannot be empty.");
      candidate = "";
      continue;
    }

    if (slugExists(normalized)) {
      console.log(
        `Slug "${normalized}" already exists. Please choose another one.`,
      );
      candidate = normalized;
      continue;
    }

    return normalized;
  }
}

async function promptForCategory(rl, categoryStats) {
  printStats("Categories:", categoryStats);

  while (true) {
    const answer = await rl.question(
      "Category (number or name) [Uncategorized]: ",
    );

    try {
      return parseCategoryInput(answer, categoryStats);
    } catch (error) {
      console.log(error.message);
    }
  }
}

async function promptForTags(rl, tagStats) {
  printStats("Tags:", tagStats);

  while (true) {
    const answer = await rl.question(
      "Tags (numbers or names, comma separated, empty for none): ",
    );

    try {
      return parseTagInput(answer, tagStats);
    } catch (error) {
      console.log(error.message);
    }
  }
}

async function promptForDraft(rl) {
  while (true) {
    const answer = (await rl.question("Draft? [Y/n]: ")).trim();
    if (!answer) {
      return true;
    }

    try {
      return parseBooleanFlag(answer, true);
    } catch {
      console.log('Please answer with "y", "yes", "n", or "no".');
    }
  }
}

async function runNew(flags) {
  if (flags.draft && flags.published) {
    throw new Error("Use either --draft or --published, not both.");
  }

  const rl = readline.createInterface({ input, output });

  try {
    const title = flags.title?.trim() || (await promptForTitle(rl));
    const initialSlug = flags.slug?.trim() || slugifyTitle(title);
    const slug = flags.slug?.trim()
      ? await validateProvidedSlug(flags.slug)
      : await promptForSlug(rl, initialSlug);

    const dateInput =
      flags.date?.trim() ||
      (await promptWithDefault(rl, "Date", todayString()));
    const date = normalizeDate(dateInput);

    const summary =
      flags.summary != null
        ? String(flags.summary).trim()
        : await promptWithDefault(rl, "Summary", "");

    const categoryStats = getCategoryStats();
    const category =
      flags.category?.trim() || (await promptForCategory(rl, categoryStats));

    const tagStats = getTagStats();
    const tags =
      flags.tags != null
        ? parseTagInput(String(flags.tags), tagStats)
        : await promptForTags(rl, tagStats);

    const draft = flags.draft
      ? true
      : flags.published
        ? false
        : await promptForDraft(rl);

    const content = createPostTemplate({
      title,
      date,
      summary,
      tags,
      category,
      draft,
    });

    writePostFile(slug, content);

    console.log("");
    console.log(`Created: ${slugToFilePath(slug)}`);
    console.log(`Posts dir: ${getPostsDir()}`);
  } finally {
    rl.close();
  }
}

async function validateProvidedSlug(rawSlug) {
  const slug = slugifyTitle(rawSlug);
  if (!slug) {
    throw new Error("Slug cannot be empty.");
  }
  if (slugExists(slug)) {
    throw new Error(`Slug "${slug}" already exists.`);
  }
  return slug;
}

async function main() {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const command = positionals[0] ?? "help";

  switch (command) {
    case "help":
      printHelp();
      break;
    case "categories":
      printStats("Categories:", getCategoryStats());
      break;
    case "tags":
      printStats("Tags:", getTagStats());
      break;
    case "new":
      await runNew(flags);
      break;
    default:
      throw new Error(`Unknown command "${command}". Run "pnpm cli help".`);
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
