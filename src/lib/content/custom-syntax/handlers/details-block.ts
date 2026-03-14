import type { CustomSyntaxBlockHandler } from "@/lib/content/custom-syntax/types";
import {
  BLOCK_END_RE,
  DETAILS_START_RE,
  DOUBLE_BLOCK_START_RE,
} from "@/lib/content/custom-syntax/utils";

function findDetailsEnd(lines: string[], startLine: number) {
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

    if (DOUBLE_BLOCK_START_RE.test(current) && !BLOCK_END_RE.test(current)) {
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

export const detailsBlockHandler: CustomSyntaxBlockHandler = {
  kind: "container",
  match: ({ children, index, getNodeSource }) => {
    const node = children[index];

    if (!node) {
      return false;
    }

    const snippet = getNodeSource(node);
    const firstLine = snippet.split(/\r?\n/, 1)[0]?.trim() ?? "";
    return DETAILS_START_RE.test(firstLine);
  },
  name: "details-block",
  priority: 10,
  transform: (context) => {
    const node = context.children[context.index];
    const startLine = node.position?.start?.line;

    if (!startLine) {
      return { consumed: 1, nodes: [node] };
    }

    const openingLine = context.getLine(startLine).trim();
    const detailsMatch = openingLine.match(DETAILS_START_RE);

    if (!detailsMatch) {
      return { consumed: 1, nodes: [node] };
    }

    const endLine = findDetailsEnd(context.lines, startLine);

    if (endLine === -1) {
      throw new Error(`Unclosed ":: details" block at line ${startLine}`);
    }

    const bodyMarkdown = context.lines.slice(startLine, endLine - 1).join("\n");
    const summaryText = detailsMatch[2]?.trim() ?? "";
    const children = [
      context.createFlowElement("summary", {}, [
        context.createText(summaryText || "Details"),
      ]),
      ...context.transformFragment(bodyMarkdown),
    ];
    const props = detailsMatch[1] ? { open: true } : {};

    return {
      consumed: context.consumeThroughLine(endLine),
      nodes: [context.createFlowElement("details", props, children)],
    };
  },
};
