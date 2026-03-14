import type { CustomSyntaxBlockHandler } from "@/lib/content/custom-syntax/types";
import {
  COMPONENT_START_RE,
  LEGACY_CHART_BLOCK_COMPONENTS,
  LEGACY_COMPONENT_RE,
} from "@/lib/content/custom-syntax/utils";

export const legacyGuardBlockHandler: CustomSyntaxBlockHandler = {
  kind: "block",
  match: ({ children, index, getNodeSource }) => {
    const node = children[index];

    if (!node) {
      return false;
    }

    if (node.type === "html" && LEGACY_COMPONENT_RE.test(node.value)) {
      return true;
    }

    const snippet = getNodeSource(node);
    const firstLine = snippet.split(/\r?\n/, 1)[0]?.trim() ?? "";
    const match = firstLine.match(COMPONENT_START_RE);
    return Boolean(match && LEGACY_CHART_BLOCK_COMPONENTS.has(match[1]));
  },
  name: "legacy-guard-block",
  priority: 100,
  transform: (context) => {
    const node = context.children[context.index];
    const startLine = node?.position?.start?.line ?? context.index + 1;

    if (node?.type === "html" && LEGACY_COMPONENT_RE.test(node.value)) {
      throw new Error(
        `Legacy MDX component syntax is not supported. Use "::ComponentName" with YAML props instead. (line ${startLine})`,
      );
    }

    const openingLine = context.getLine(startLine).trim();
    const match = openingLine.match(COMPONENT_START_RE);

    if (match && LEGACY_CHART_BLOCK_COMPONENTS.has(match[1])) {
      throw new Error(
        `Legacy chart block syntax "::${match[1]}" is not supported. Use \`\`\`chart JSON code blocks instead. (line ${startLine})`,
      );
    }

    return { consumed: 1, nodes: node ? [node] : [] };
  },
};
