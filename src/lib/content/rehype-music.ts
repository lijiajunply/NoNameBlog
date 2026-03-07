import { visit } from "unist-util-visit";

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

function hasMusicLanguage(node: HastNode): boolean {
  const className = node.properties?.className;

  if (typeof className === "string") {
    return className.split(/\s+/).includes("language-music");
  }

  if (Array.isArray(className)) {
    return className.some((name) => `${name}` === "language-music");
  }

  return false;
}

function extractText(node: HastNode): string {
  if (node.type === "text") {
    return node.value ?? "";
  }

  if (!node.children || node.children.length === 0) {
    return "";
  }

  return node.children.map((child) => extractText(child)).join("");
}

export function rehypeMusic() {
  return (tree: HastNode) => {
    visit(
      tree,
      "element",
      (
        node: HastNode,
        index: number | undefined,
        parent: HastNode | undefined,
      ) => {
        if (!parent || typeof index !== "number") {
          return;
        }

        if (node.tagName !== "pre") {
          return;
        }

        const [codeNode] = node.children ?? [];
        if (
          !codeNode ||
          codeNode.type !== "element" ||
          codeNode.tagName !== "code"
        ) {
          return;
        }

        if (!hasMusicLanguage(codeNode)) {
          return;
        }

        const score = extractText(codeNode).trim();

        parent.children = parent.children ?? [];
        parent.children[index] = {
          type: "element",
          tagName: "MusicScore",
          properties: {
            score,
          },
          children: [],
        };
      },
    );
  };
}
