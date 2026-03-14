import type { RootContent } from "mdast";
import type { CustomSyntaxBlockHandler } from "@/lib/content/custom-syntax/types";
import {
  BLOCK_END_RE,
  COMPONENT_START_RE,
  LEGACY_CHART_BLOCK_COMPONENTS,
  YAML_BODY_SPLIT_RE,
} from "@/lib/content/custom-syntax/utils";

function findBlockEnd(
  lines: string[],
  startLine: number,
  isNestedStart: (line: string) => boolean,
) {
  let cursor = startLine + 1;
  let nestedDepth = 0;
  let innerFenceMarker: "```" | "~~~" | null = null;

  while (cursor <= lines.length) {
    const current = lines[cursor - 1] ?? "";

    if (innerFenceMarker) {
      if (current.trimStart().startsWith(innerFenceMarker)) {
        innerFenceMarker = null;
      }
      cursor += 1;
      continue;
    }

    const trimmedCurrent = current.trimStart();
    if (trimmedCurrent.startsWith("```")) {
      innerFenceMarker = "```";
      cursor += 1;
      continue;
    }
    if (trimmedCurrent.startsWith("~~~")) {
      innerFenceMarker = "~~~";
      cursor += 1;
      continue;
    }

    if (isNestedStart(current) && !BLOCK_END_RE.test(current)) {
      nestedDepth += 1;
      cursor += 1;
      continue;
    }

    if (BLOCK_END_RE.test(current)) {
      if (nestedDepth === 0) {
        return cursor;
      }
      nestedDepth -= 1;
    }

    cursor += 1;
  }

  return -1;
}

export const componentBlockHandler: CustomSyntaxBlockHandler = {
  kind: "block",
  match: ({ children, index, getNodeSource }) => {
    const node = children[index];

    if (!node) {
      return false;
    }

    const snippet = getNodeSource(node);
    const firstLine = snippet.split(/\r?\n/, 1)[0]?.trim() ?? "";
    return COMPONENT_START_RE.test(firstLine);
  },
  name: "component-block",
  transform: (context) => {
    const node = context.children[context.index];
    const startLine = node.position?.start?.line;

    if (!startLine) {
      return { consumed: 1, nodes: [node] };
    }

    const openingLine = context.getLine(startLine).trim();
    const componentMatch = openingLine.match(COMPONENT_START_RE);

    if (!componentMatch) {
      return { consumed: 1, nodes: [node] };
    }

    const componentName = componentMatch[1];

    if (LEGACY_CHART_BLOCK_COMPONENTS.has(componentName)) {
      throw new Error(
        `Legacy chart block syntax "::${componentName}" is not supported. Use \`\`\`chart JSON code blocks instead. (line ${startLine})`,
      );
    }

    const endLine = findBlockEnd(context.lines, startLine, (line) =>
      COMPONENT_START_RE.test(line),
    );

    if (endLine === -1) {
      throw new Error(
        `Unclosed "::${componentName}" block at line ${startLine}`,
      );
    }

    const blockLines = context.lines.slice(startLine, endLine - 1);
    const splitAt = blockLines.findIndex((line) =>
      YAML_BODY_SPLIT_RE.test(line),
    );
    const yamlLines =
      splitAt === -1 ? blockLines : blockLines.slice(0, splitAt);
    const bodyLines = splitAt === -1 ? [] : blockLines.slice(splitAt + 1);
    const props = context.parseYamlProps(yamlLines.join("\n"));
    const bodyMarkdown = bodyLines.join("\n");
    const children: RootContent[] = bodyMarkdown
      ? context.transformFragment(bodyMarkdown)
      : [];

    return {
      consumed: context.consumeThroughLine(endLine),
      nodes: [context.createFlowElement(componentName, props, children)],
    };
  },
};
