#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const ROLLOUT_PATH =
  '/Users/luckyfish/.codex/sessions/2026/03/02/rollout-2026-03-02T00-51-22-019caa4f-cd46-7d00-aa3d-16600917b5eb.jsonl';

const normalizeNotionId = (input) => {
  if (!input) return '';
  const s = String(input).toLowerCase();
  const hit32 = s.match(/[0-9a-f]{32}/);
  if (hit32) return hit32[0];
  const hit36 = s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  if (hit36) return hit36[0].replace(/-/g, '');
  return '';
};

const canonicalNotionUrl = (input) => {
  const id = normalizeNotionId(input);
  return id ? `https://www.notion.so/${id}` : '';
};

const collapseBlankLinesOutsideCode = (text) => {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let inFence = false;
  let lastBlank = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inFence = !inFence;
      out.push(line);
      lastBlank = false;
      continue;
    }

    if (!inFence && line.trim() === '') {
      if (!lastBlank) out.push('');
      lastBlank = true;
    } else {
      out.push(line);
      lastBlank = false;
    }
  }

  return out.join('\n').replace(/^\n+|\n+$/g, '') + '\n';
};

const extractContent = (text) => {
  const m = text.match(/<content>\n?([\s\S]*?)\n?<\/content>/);
  if (!m) return '';
  return m[1];
};

const tryParseJSON = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

const decodeNotionFetchPayload = (payloadOutput) => {
  if (typeof payloadOutput !== 'string' || !payloadOutput.trim().startsWith('[')) return null;
  const arr = tryParseJSON(payloadOutput);
  if (!Array.isArray(arr)) return null;

  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    if (typeof item.text !== 'string') continue;
    const inner = tryParseJSON(item.text);
    if (!inner || typeof inner !== 'object') continue;
    if (inner?.metadata?.type !== 'page') continue;
    if (typeof inner.text !== 'string' || !inner.text.includes('<content>')) continue;

    const notionId = normalizeNotionId(inner.url || inner.id || inner.text);
    const content = extractContent(inner.text);
    if (!notionId || !content) continue;

    return {
      notionId,
      url: canonicalNotionUrl(inner.url || notionId),
      content,
    };
  }

  return null;
};

const inferExtFromUrl = (url) => {
  try {
    const u = new URL(url);
    const ext = path.extname(u.pathname).toLowerCase();
    if (ext && ext.length <= 8) return ext === '.jpeg' ? '.jpg' : ext;
  } catch {}
  return '';
};

const inferExtFromContentType = (ct) => {
  if (!ct) return '.bin';
  const t = ct.toLowerCase();
  if (t.includes('image/png')) return '.png';
  if (t.includes('image/jpeg')) return '.jpg';
  if (t.includes('image/webp')) return '.webp';
  if (t.includes('image/gif')) return '.gif';
  if (t.includes('image/svg+xml')) return '.svg';
  if (t.includes('image/bmp')) return '.bmp';
  if (t.includes('image/avif')) return '.avif';
  return '.bin';
};

const downloadAndRewriteImages = async (slug, body) => {
  const imageDir = path.join(ROOT, 'public', 'notion-images', slug);
  await fs.mkdir(imageDir, { recursive: true });

  const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
  const matches = [...body.matchAll(imageRegex)];

  const uniqueUrlOrder = [];
  const seen = new Set();
  for (const m of matches) {
    const url = m[2];
    if (!seen.has(url)) {
      seen.add(url);
      uniqueUrlOrder.push(url);
    }
  }

  let downloaded = 0;
  const failed = [];
  const urlToLocal = new Map();

  for (const url of uniqueUrlOrder) {
    let timer;
    try {
      const ctrl = new AbortController();
      timer = setTimeout(() => ctrl.abort(), 12000);
      const resp = await fetch(url, { redirect: 'follow', signal: ctrl.signal });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      let ext = inferExtFromUrl(url);
      const ct = resp.headers.get('content-type') || '';
      if (!ext) ext = inferExtFromContentType(ct);
      if (ext === '.jpeg') ext = '.jpg';

      const hash = createHash('sha1').update(url).digest('hex').slice(0, 12);
      const fileName = `${String(downloaded + 1).padStart(3, '0')}-${hash}${ext}`;
      const outPath = path.join(imageDir, fileName);

      const ab = await resp.arrayBuffer();
      await fs.writeFile(outPath, Buffer.from(ab));
      const localPath = `/notion-images/${slug}/${fileName}`;
      urlToLocal.set(url, localPath);
      downloaded += 1;
    } catch {
      failed.push(url);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  let rewritten = body;
  for (const m of matches) {
    const alt = m[1];
    const url = m[2];
    const local = urlToLocal.get(url);
    if (!local) continue;
    const oldMd = `![${alt}](${url})`;
    const newMd = `![${alt}](${local})`;
    rewritten = rewritten.split(oldMd).join(newMd);
  }

  return { body: rewritten, downloaded, failed };
};

const readPostMappings = async () => {
  const files = (await fs.readdir(POSTS_DIR))
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => path.join(POSTS_DIR, f));

  const byNotionId = new Map();
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const m = raw.match(/原文链接：https:\/\/www\.notion\.so\/([0-9a-fA-F-]+)/);
    if (!m) continue;
    const notionId = normalizeNotionId(m[1]);
    if (!notionId) continue;
    byNotionId.set(notionId, file);
  }
  return byNotionId;
};

const parseRolloutContents = async () => {
  const raw = await fs.readFile(ROLLOUT_PATH, 'utf8');
  const lines = raw.split('\n').filter(Boolean);
  const byNotionId = new Map();

  for (const line of lines) {
    const obj = tryParseJSON(line);
    if (!obj || obj.type !== 'response_item') continue;
    if (!obj.payload || obj.payload.type !== 'function_call_output') continue;

    const parsed = decodeNotionFetchPayload(obj.payload.output);
    if (!parsed) continue;
    byNotionId.set(parsed.notionId, parsed);
  }

  return byNotionId;
};

const main = async () => {
  const postMap = await readPostMappings();
  const notionMap = await parseRolloutContents();

  const summary = {
    rolloutPath: ROLLOUT_PATH,
    totalPostsWithSourceLink: postMap.size,
    extractedNotionPages: notionMap.size,
    syncedFiles: 0,
    missingContentPosts: [],
    totalImagesDownloaded: 0,
    perPost: {},
    failedImageUrls: [],
  };

  for (const [notionId, file] of postMap.entries()) {
    const parsed = notionMap.get(notionId);
    if (!parsed) {
      summary.missingContentPosts.push({
        file,
        notionUrl: canonicalNotionUrl(notionId),
      });
      continue;
    }

    const raw = await fs.readFile(file, 'utf8');
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!fmMatch) {
      summary.missingContentPosts.push({
        file,
        notionUrl: parsed.url,
        reason: 'frontmatter-not-found',
      });
      continue;
    }

    const frontmatter = `---\n${fmMatch[1]}\n---\n`;
    let body = parsed.content;
    body = body
      .split('\n')
      .filter((line) => line.trim() !== '<empty-block/>')
      .join('\n');
    body = collapseBlankLinesOutsideCode(body);

    const slug = path.basename(file, '.mdx');
    const imageResult = await downloadAndRewriteImages(slug, body);
    summary.totalImagesDownloaded += imageResult.downloaded;
    summary.failedImageUrls.push(...imageResult.failed);
    summary.perPost[slug] = imageResult.downloaded;

    const next = `${frontmatter}\n${imageResult.body}`;
    await fs.writeFile(file, next, 'utf8');
    summary.syncedFiles += 1;
  }

  const summaryPath = '/tmp/notion_sync_from_rollout_summary.json';
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify({ ...summary, summaryPath }));
};

await main();
