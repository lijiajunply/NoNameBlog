import matter from "gray-matter";
import type { MdxJsxAttribute, Root, RootContent, Text } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import type { NodeWithPosition } from "@/lib/content/custom-syntax/types";

export const YAML_PROP_PREFIX = "__YAML__";
export const YAML_BODY_SPLIT_RE = /^---\s*$/;
export const COMPONENT_START_RE = /^::([A-Za-z][A-Za-z0-9_]*)\s*$/;
export const DETAILS_START_RE =
  /^::\s*details(?:\s+(\[open\]))?(?:\s+(.*\S))?\s*$/i;
export const DOUBLE_BLOCK_START_RE =
  /^::(?:[A-Za-z][A-Za-z0-9_]*|\s+details(?:\s+.*)?)\s*$/i;
export const BLOCK_END_RE = /^::\s*$/;
export const LEGACY_COMPONENT_RE =
  /<(AreaChart|ChartTooltip|XAxis|GitHubCalendarCard|MermaidDiagram|Card)\b/;
export const LEGACY_CHART_BLOCK_COMPONENTS = new Set([
  "AreaChart",
  "Area",
  "Grid",
  "ChartTooltip",
  "XAxis",
]);

type SourceLineResult = {
  lines: string[];
};

export function createSourceLineResult(source: string): SourceLineResult {
  return {
    lines: source.split(/\r?\n/),
  };
}

export function getLine(lines: string[], lineNumber: number) {
  return lines[lineNumber - 1] ?? "";
}

export function getNodeSource(source: string, node: NodeWithPosition) {
  const start = node.position?.start?.offset;
  const end = node.position?.end?.offset;

  if (typeof start !== "number" || typeof end !== "number") {
    return "";
  }

  return source.slice(start, end);
}

export function parseYamlProps(yamlSource: string) {
  const trimmed = yamlSource.trim();

  if (!trimmed) {
    return {} as Record<string, unknown>;
  }

  const { data } = matter(`---\n${yamlSource}\n---\n`);
  return (data ?? {}) as Record<string, unknown>;
}

function escapeHtmlAttr(raw: string) {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function serializeAttrValue(value: unknown) {
  if (typeof value === "string") {
    return escapeHtmlAttr(value);
  }

  return `${YAML_PROP_PREFIX}${encodeURIComponent(JSON.stringify(value))}`;
}

function createAttribute(name: string, value: unknown): MdxJsxAttribute {
  return {
    type: "mdxJsxAttribute",
    name,
    value: value == null ? null : serializeAttrValue(value),
  };
}

export function createText(value: string): Text {
  return {
    type: "text",
    value,
  };
}

export function createFlowElement(
  name: string,
  props: Record<string, unknown> = {},
  children: RootContent[] = [],
): RootContent {
  return {
    type: "mdxJsxFlowElement",
    name,
    attributes: Object.entries(props).map(([key, value]) =>
      createAttribute(key, value),
    ),
    children,
  };
}

export function createInlineTextElement(
  name: string,
  props: Record<string, unknown> = {},
  text = "",
): RootContent {
  return {
    type: "mdxJsxTextElement",
    name,
    attributes: Object.entries(props).map(([key, value]) =>
      createAttribute(key, value),
    ),
    children: text ? [createText(text)] : [],
  };
}

export function parseMarkdownFragment(markdown: string) {
  return unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
}
