import matter from "gray-matter";

type YamlData = Record<string, unknown>;
const YAML_PROP_PREFIX = "__YAML__";

const COMPONENT_START_RE = /^::([A-Za-z][A-Za-z0-9_]*)\s*$/;
const BLOCK_END_RE = /^::\s*$/;
const YAML_BODY_SPLIT_RE = /^---\s*$/;
const LEGACY_COMPONENT_RE =
  /<(AreaChart|ChartTooltip|XAxis|GitHubCalendarCard|MermaidDiagram|Card)\b/;

function parseYamlProps(yamlSource: string): YamlData {
  const trimmed = yamlSource.trim();

  if (!trimmed) {
    return {};
  }

  const { data } = matter(`---\n${yamlSource}\n---\n`);
  return (data ?? {}) as YamlData;
}

function buildMdxComponent(
  name: string,
  props: YamlData,
  body: string | undefined,
): string {
  const attrs = Object.entries(props)
    .map(([key, value]) => `${key}="${serializeAttrValue(value)}"`)
    .join(" ");
  const attrSegment = attrs ? ` ${attrs}` : "";
  const bodyTrimmed = body?.trim();

  if (!bodyTrimmed) {
    return `<${name}${attrSegment} />`;
  }

  return `<${name}${attrSegment}>\n${bodyTrimmed}\n</${name}>`;
}

function escapeHtmlAttr(raw: string): string {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function serializeAttrValue(value: unknown): string {
  if (typeof value === "string") {
    return escapeHtmlAttr(value);
  }

  return `${YAML_PROP_PREFIX}${encodeURIComponent(JSON.stringify(value))}`;
}

/**
 * Custom syntax:
 * ::ComponentName
 * propA: "value"
 * count: 2
 * ::
 *
 * Optional body:
 * ::ComponentName
 * title: "Card title"
 * ---
 * Body content
 * ::
 */
export function transformColonComponents(source: string): string {
  const lines = source.split(/\r?\n/);
  const output: string[] = [];
  let index = 0;
  let fencedCodeMarker: "```" | "~~~" | null = null;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (fencedCodeMarker) {
      output.push(line);
      if (line.trimStart().startsWith(fencedCodeMarker)) {
        fencedCodeMarker = null;
      }
      index += 1;
      continue;
    }

    const trimmedStart = line.trimStart();
    if (trimmedStart.startsWith("```")) {
      fencedCodeMarker = "```";
      output.push(line);
      index += 1;
      continue;
    }
    if (trimmedStart.startsWith("~~~")) {
      fencedCodeMarker = "~~~";
      output.push(line);
      index += 1;
      continue;
    }

    if (LEGACY_COMPONENT_RE.test(line)) {
      throw new Error(
        `Legacy MDX component syntax is not supported. Use "::ComponentName" with YAML props instead. (line ${index + 1})`,
      );
    }

    const componentMatch = line.match(COMPONENT_START_RE);

    if (!componentMatch) {
      output.push(line);
      index += 1;
      continue;
    }

    const componentName = componentMatch[1];
    const blockLines: string[] = [];
    let foundEnd = false;
    let cursor = index + 1;

    while (cursor < lines.length) {
      const current = lines[cursor] ?? "";
      if (BLOCK_END_RE.test(current)) {
        foundEnd = true;
        break;
      }
      blockLines.push(current);
      cursor += 1;
    }

    if (!foundEnd) {
      throw new Error(
        `Unclosed "::${componentName}" block at line ${index + 1}`,
      );
    }

    const splitAt = blockLines.findIndex((v) => YAML_BODY_SPLIT_RE.test(v));
    const yamlLines =
      splitAt === -1 ? blockLines : blockLines.slice(0, splitAt);
    const bodyLines = splitAt === -1 ? [] : blockLines.slice(splitAt + 1);

    const props = parseYamlProps(yamlLines.join("\n"));
    const mdxNode = buildMdxComponent(
      componentName,
      props,
      bodyLines.join("\n"),
    );
    output.push(mdxNode);

    // Move index to the line after ending token "::"
    index = cursor + 1;
  }

  return output.join("\n");
}
