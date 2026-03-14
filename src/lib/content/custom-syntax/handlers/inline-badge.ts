import type { RootContent, Text } from "mdast";
import type { CustomSyntaxInlineHandler } from "@/lib/content/custom-syntax/types";

type InlineComponentMatch = {
  body: string;
  name: string;
  option: string;
  params: Record<string, string>;
};

type InlineComponentDefinition = {
  componentName: string;
  buildProps: (match: InlineComponentMatch) => Record<string, unknown>;
};

const INLINE_COMPONENT_DEFINITIONS: Record<string, InlineComponentDefinition> =
  {
    badge: {
      componentName: "Badge",
      buildProps: ({ option, params }) => {
        const shape = params.shape || params.variant || option || "default";
        return { shape };
      },
    },
  };

function parseInlineComponentParams(option: string) {
  const trimmed = option.trim();

  if (!trimmed || !trimmed.includes("=")) {
    return {
      option: trimmed,
      params: {} as Record<string, string>,
    };
  }

  const params: Record<string, string> = {};

  for (const segment of trimmed.split(",")) {
    const entry = segment.trim();

    if (!entry) {
      continue;
    }

    const separatorIndex = entry.indexOf("=");

    if (separatorIndex === -1) {
      return {
        option: trimmed,
        params: {} as Record<string, string>,
      };
    }

    const key = entry.slice(0, separatorIndex).trim();
    const value = entry.slice(separatorIndex + 1).trim();

    if (!key) {
      return {
        option: trimmed,
        params: {} as Record<string, string>,
      };
    }

    params[key] = value;
  }

  return {
    option: "",
    params,
  };
}

function extractInlineText(children: RootContent[]): string {
  return children
    .map((child) =>
      child.type === "text"
        ? child.value
        : "children" in child
          ? extractInlineText(child.children as RootContent[])
          : "",
    )
    .join("");
}

function isBadgeMarkerNode(
  node: RootContent | undefined,
  getNodeSource: (node: Text) => string,
) {
  if (!node || node.type !== "text") {
    return false;
  }

  const rawSource = getNodeSource(node);

  if (rawSource.endsWith("\\:badge")) {
    return false;
  }

  return node.value.endsWith(":badge");
}

export const inlineBadgeHandler: CustomSyntaxInlineHandler = {
  kind: "inline",
  match: (nodes, index, context) => {
    const current = nodes[index];
    const next = nodes[index + 1];
    return (
      current?.type === "text" &&
      next?.type === "link" &&
      isBadgeMarkerNode(current, (node) => context.getNodeSource(node))
    );
  },
  name: "inline-badge",
  transform: (nodes, index, context) => {
    const current = nodes[index];
    const next = nodes[index + 1];

    if (current?.type !== "text" || next?.type !== "link") {
      return { consumed: 1, nodes: current ? [current] : [] };
    }

    const markerMatch = current.value.match(/^(.*):([A-Za-z][A-Za-z0-9_-]*)$/);

    if (!markerMatch) {
      return { consumed: 1, nodes: [current] };
    }

    const name = markerMatch[2];
    const definition = INLINE_COMPONENT_DEFINITIONS[name];

    if (!definition) {
      return { consumed: 1, nodes: [current] };
    }

    const parsedOption = parseInlineComponentParams(next.url);
    const output: RootContent[] = [];
    const leadingText = markerMatch[1];

    if (leadingText) {
      output.push(context.createText(leadingText));
    }

    output.push(
      context.createInlineTextElement(
        definition.componentName,
        definition.buildProps({
          body: extractInlineText(next.children),
          name,
          option: parsedOption.option,
          params: parsedOption.params,
        }),
        extractInlineText(next.children),
      ),
    );

    return {
      consumed: 2,
      nodes: output,
    };
  },
};
