import type { Parent, Root, RootContent } from "mdast";
import { componentBlockHandler } from "@/lib/content/custom-syntax/handlers/component-block";
import { detailsBlockHandler } from "@/lib/content/custom-syntax/handlers/details-block";
import { inlineBadgeHandler } from "@/lib/content/custom-syntax/handlers/inline-badge";
import { legacyGuardBlockHandler } from "@/lib/content/custom-syntax/handlers/legacy-guard";
import { tabsFenceHandler } from "@/lib/content/custom-syntax/handlers/tabs-fence";
import type {
  CustomSyntaxBlockHandler,
  CustomSyntaxInlineHandler,
  FlowNode,
  NodeWithPosition,
} from "@/lib/content/custom-syntax/types";
import {
  createFlowElement,
  createInlineTextElement,
  createSourceLineResult,
  createText,
  getLine,
  getNodeSource,
  parseMarkdownFragment,
  parseYamlProps,
} from "@/lib/content/custom-syntax/utils";

const BLOCK_HANDLERS: CustomSyntaxBlockHandler[] = [
  legacyGuardBlockHandler,
  detailsBlockHandler,
  tabsFenceHandler,
  componentBlockHandler,
].sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0));

const INLINE_HANDLERS: CustomSyntaxInlineHandler[] = [inlineBadgeHandler].sort(
  (left, right) => (right.priority ?? 0) - (left.priority ?? 0),
);

type ParentWithChildren = Parent & {
  children: RootContent[];
};

function isParent(value: unknown): value is ParentWithChildren {
  return Boolean(value && typeof value === "object" && "children" in value);
}

function transformInlineChildren(parent: ParentWithChildren, source: string) {
  const nextChildren: RootContent[] = [];
  let index = 0;

  while (index < parent.children.length) {
    const handler = INLINE_HANDLERS.find((candidate) =>
      candidate.match(parent.children, index, {
        createInlineTextElement,
        createText,
        getNodeSource: (node: NodeWithPosition) => getNodeSource(source, node),
        source,
      }),
    );

    if (!handler) {
      nextChildren.push(parent.children[index] as RootContent);
      index += 1;
      continue;
    }

    const result = handler.transform(parent.children, index, {
      createInlineTextElement,
      createText,
      getNodeSource: (node: NodeWithPosition) => getNodeSource(source, node),
      source,
    });

    nextChildren.push(...result.nodes);
    index += result.consumed;
  }

  parent.children = nextChildren;
}

function transformBlockChildren(
  parent: ParentWithChildren,
  source: string,
  transformTree: (tree: Root, sourceOverride?: string) => Root,
) {
  const { lines } = createSourceLineResult(source);
  const originalChildren = parent.children as FlowNode[];
  const nextChildren: RootContent[] = [];
  let index = 0;

  while (index < originalChildren.length) {
    const handler = BLOCK_HANDLERS.find((candidate) =>
      candidate.match({
        children: originalChildren,
        getNodeSource: (node: NodeWithPosition) => getNodeSource(source, node),
        index,
        lines,
        source,
      }),
    );

    if (!handler) {
      nextChildren.push(originalChildren[index] as RootContent);
      index += 1;
      continue;
    }

    const result = handler.transform({
      children: originalChildren,
      index,
      lines,
      source,
      consumeThroughLine: (endLine) => {
        let cursor = index;

        while (cursor < originalChildren.length) {
          const childEndLine = originalChildren[cursor]?.position?.end?.line;

          if (typeof childEndLine === "number" && childEndLine >= endLine) {
            return cursor - index + 1;
          }

          cursor += 1;
        }

        return originalChildren.length - index;
      },
      createFlowElement,
      createInlineTextElement,
      createText,
      getLine: (lineNumber: number) => getLine(lines, lineNumber),
      getNodeSource: (node: NodeWithPosition) => getNodeSource(source, node),
      parseYamlProps,
      transformFragment: (markdown: string) => {
        const fragmentTree = parseMarkdownFragment(markdown);
        return transformTree(fragmentTree, markdown).children;
      },
    });

    nextChildren.push(...result.nodes);
    index += result.consumed;
  }

  parent.children = nextChildren;
}

function transformTree(tree: Root, sourceOverride = ""): Root {
  const source = sourceOverride;

  const walk = (node: RootContent | Root) => {
    if (!isParent(node)) {
      return;
    }

    transformBlockChildren(node, source, transformTree);
    transformInlineChildren(node, source);

    for (const child of node.children) {
      walk(child as RootContent);
    }
  };

  walk(tree);

  return tree;
}

export function createCustomSyntaxRemarkPlugin() {
  return (tree: Root, file: { value?: unknown }) => {
    const source = typeof file.value === "string" ? file.value : "";
    transformTree(tree, source);
  };
}
