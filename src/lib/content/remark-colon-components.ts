import matter from "gray-matter";

type YamlData = Record<string, unknown>;
const YAML_PROP_PREFIX = "__YAML__";

const COMPONENT_START_RE = /^::([A-Za-z][A-Za-z0-9_]*)\s*$/;
const DETAILS_START_RE = /^::\s*details(?:\s+(\[open\]))?(?:\s+(.*\S))?\s*$/i;
const DOUBLE_BLOCK_START_RE =
  /^::(?:[A-Za-z][A-Za-z0-9_]*|\s+details(?:\s+.*)?)\s*$/i;
const BLOCK_END_RE = /^::\s*$/;
const YAML_BODY_SPLIT_RE = /^---\s*$/;
const LEGACY_COMPONENT_RE =
  /<(AreaChart|ChartTooltip|XAxis|GitHubCalendarCard|MermaidDiagram|Card)\b/;
const LEGACY_CHART_BLOCK_COMPONENTS = new Set([
  "AreaChart",
  "Area",
  "Grid",
  "ChartTooltip",
  "XAxis",
]);

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
    if (trimmedStart.startsWith("```tab")) {
      const openingFence = trimmedStart.match(/^(`{3,}|~{3,})/)?.[0] || "```";
      let cursor = index + 1;
      const blockLines: string[] = [];
      let tempInnerFence: string | null = null;
      
      while (cursor < lines.length) {
        const current = lines[cursor] ?? "";
        const trimmedCurrent = current.trimStart();

        // Handle nested code blocks during collection
        if (tempInnerFence) {
          if (trimmedCurrent.startsWith(tempInnerFence)) {
             tempInnerFence = null;
          }
          blockLines.push(current);
          cursor += 1;
          continue;
        }

        if (trimmedCurrent.startsWith("```") && !trimmedCurrent.startsWith("```tab") && current.trim() !== openingFence) {
          tempInnerFence = "```";
          blockLines.push(current);
          cursor += 1;
          continue;
        }
        if (trimmedCurrent.startsWith("~~~") && current.trim() !== openingFence) {
          tempInnerFence = "~~~";
          blockLines.push(current);
          cursor += 1;
          continue;
        }

        if (current.trim() === openingFence) {
          break;
        }
        blockLines.push(current);
        cursor += 1;
      }

      const sections: string[] = [];
      let currentSection: string[] = [];
      let inInnerFence: string | null = null;
      let isFirstSeparatorFound = false;
      let yamlStr = "";

      for (const bLine of blockLines) {
        const trimmed = bLine.trim();
        
        // Handle inner fences to avoid splitting on --- inside code blocks
        if (inInnerFence) {
          if (trimmed.startsWith(inInnerFence)) inInnerFence = null;
          currentSection.push(bLine);
          continue;
        }
        if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
          inInnerFence = trimmed.slice(0, 3);
          currentSection.push(bLine);
          continue;
        }

        if (YAML_BODY_SPLIT_RE.test(bLine)) {
          if (!isFirstSeparatorFound) {
            yamlStr = currentSection.join("\n");
            isFirstSeparatorFound = true;
          } else {
            sections.push(currentSection.join("\n"));
          }
          currentSection = [];
        } else {
          currentSection.push(bLine);
        }
      }
      sections.push(currentSection.join("\n"));

      const props = parseYamlProps(yamlStr);
      const labels = Array.isArray(props.tabs) ? props.tabs : [];
      delete props.tabs;

      const tabsData = sections
        .map((s) => s.trim())
        .filter((s, idx) => s.length > 0 || idx < labels.length)
        .map((section, idx) => {
          const label = labels[idx] || `Tab ${idx + 1}`;
          return {
            label,
            content: transformColonComponents(section),
            value: `tab-${idx}`,
          };
        });

      if (tabsData.length === 0) {
        index = cursor + 1;
        continue;
      }

      const defaultValue = props.defaultValue || tabsData[0]?.value || "";
      const tabsProps = { ...props, defaultValue } as any;

      const tabsTriggerElements = tabsData
        .map((t) => `<TabsTrigger value="${t.value}">${t.label}</TabsTrigger>`)
        .join("\n\n");

      const tabsContentElements = tabsData
        .map((t) => {
           return `<TabsContent value="${t.value}">\n\n${t.content}\n\n</TabsContent>`;
        })
        .join("\n\n");

      const tabsNode = buildMdxComponent(
        "Tabs",
        tabsProps,
        `\n\n<TabsList>\n\n${tabsTriggerElements}\n\n</TabsList>\n\n${tabsContentElements}\n\n`,
      );

      output.push(tabsNode);
      index = cursor + 1;
      continue;
    }

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

    const detailsMatch = line.match(DETAILS_START_RE);

    if (detailsMatch) {
      const isOpenByDefault = Boolean(detailsMatch[1]);
      const summaryText = detailsMatch[2]?.trim() ?? "";
      const detailsBodyLines: string[] = [];
      let foundDetailsEnd = false;
      let cursor = index + 1;
      let nestedDepth = 0;
      let innerFenceMarker: "```" | "~~~" | null = null;

      while (cursor < lines.length) {
        const current = lines[cursor] ?? "";

        if (innerFenceMarker) {
          detailsBodyLines.push(current);
          if (current.trimStart().startsWith(innerFenceMarker)) {
            innerFenceMarker = null;
          }
          cursor += 1;
          continue;
        }

        const trimmedCurrent = current.trimStart();
        if (trimmedCurrent.startsWith("```")) {
          innerFenceMarker = "```";
          detailsBodyLines.push(current);
          cursor += 1;
          continue;
        }
        if (trimmedCurrent.startsWith("~~~")) {
          innerFenceMarker = "~~~";
          detailsBodyLines.push(current);
          cursor += 1;
          continue;
        }

        if (
          DOUBLE_BLOCK_START_RE.test(current) &&
          !BLOCK_END_RE.test(current)
        ) {
          nestedDepth += 1;
          detailsBodyLines.push(current);
          cursor += 1;
          continue;
        }

        if (BLOCK_END_RE.test(current)) {
          if (nestedDepth === 0) {
            foundDetailsEnd = true;
            break;
          }
          nestedDepth -= 1;
          detailsBodyLines.push(current);
          cursor += 1;
          continue;
        }

        detailsBodyLines.push(current);
        cursor += 1;
      }

      if (!foundDetailsEnd) {
        throw new Error(`Unclosed ":: details" block at line ${index + 1}`);
      }

      const rawBody = detailsBodyLines.join("\n");
      const transformedBody = rawBody
        ? transformColonComponents(rawBody)
        : rawBody;
      const escapedSummary = escapeHtmlAttr(summaryText);
      const detailsNodeLines = [
        isOpenByDefault ? "<details open>" : "<details>",
        `<summary>${escapedSummary || "Details"}</summary>`,
      ];
      if (transformedBody.trim()) {
        detailsNodeLines.push("", transformedBody, "");
      }
      detailsNodeLines.push("</details>");
      const detailsNode = detailsNodeLines.join("\n");
      output.push(detailsNode);

      index = cursor + 1;
      continue;
    }

    const componentMatch = line.match(COMPONENT_START_RE);

    if (!componentMatch) {
      output.push(line);
      index += 1;
      continue;
    }

    const componentName = componentMatch[1];
    if (LEGACY_CHART_BLOCK_COMPONENTS.has(componentName)) {
      throw new Error(
        `Legacy chart block syntax "::${componentName}" is not supported. Use \`\`\`chart JSON code blocks instead. (line ${index + 1})`,
      );
    }
    const blockLines: string[] = [];
    let foundEnd = false;
    let cursor = index + 1;
    let nestedDepth = 0;
    let innerFenceMarker: "```" | "~~~" | null = null;

    while (cursor < lines.length) {
      const current = lines[cursor] ?? "";

      if (innerFenceMarker) {
        blockLines.push(current);
        if (current.trimStart().startsWith(innerFenceMarker)) {
          innerFenceMarker = null;
        }
        cursor += 1;
        continue;
      }

      const trimmedCurrent = current.trimStart();
      if (trimmedCurrent.startsWith("```")) {
        innerFenceMarker = "```";
        blockLines.push(current);
        cursor += 1;
        continue;
      }
      if (trimmedCurrent.startsWith("~~~")) {
        innerFenceMarker = "~~~";
        blockLines.push(current);
        cursor += 1;
        continue;
      }

      if (COMPONENT_START_RE.test(current)) {
        nestedDepth += 1;
        blockLines.push(current);
        cursor += 1;
        continue;
      }

      if (BLOCK_END_RE.test(current)) {
        if (nestedDepth === 0) {
          foundEnd = true;
          break;
        }
        nestedDepth -= 1;
        blockLines.push(current);
        cursor += 1;
        continue;
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
    const rawBody = bodyLines.join("\n");
    const transformedBody = rawBody
      ? transformColonComponents(rawBody)
      : rawBody;
    const mdxNode = buildMdxComponent(componentName, props, transformedBody);
    output.push(mdxNode);

    // Move index to the line after ending token "::"
    index = cursor + 1;
  }

  return output.join("\n");
}
