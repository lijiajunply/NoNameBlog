import type { Link, RootContent } from "mdast";
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
    tip: {
      componentName: "Tip",
      buildProps: ({ body, option, params }) => ({
        text: body,
        tip: params.tip || params.tooltip || params.message || option || "",
        copy:
          params.copy === "false"
            ? false
            : params.copy
              ? true
              : option === "copy"
                ? true
              : params.value
                ? true
                : false,
        value: params.value || "",
      }),
    },
  };

function parseInlineComponentParams(option: string) {
  const trimmed = option.trim();

  if (!trimmed) {
    return {
      option: trimmed,
      params: {} as Record<string, string>,
    };
  }

  if (!trimmed.includes("=") && !trimmed.includes(",")) {
    return {
      option: trimmed,
      params: {} as Record<string, string>,
    };
  }

  const params: Record<string, string> = {};
  let hasInvalidSegment = false;

  for (const segment of trimmed.split(",")) {
    const entry = segment.trim();

    if (!entry) {
      continue;
    }

    const separatorIndex = entry.indexOf("=");

    if (separatorIndex === -1) {
      params[entry] = "true";
      continue;
    }

    const key = entry.slice(0, separatorIndex).trim();
    const value = entry.slice(separatorIndex + 1).trim();

    if (!key) {
      hasInvalidSegment = true;
      break;
    }

    params[key] = value;
  }

  if (hasInvalidSegment) {
    return {
      option: trimmed,
      params: {} as Record<string, string>,
    };
  }

  return {
    option: "",
    params,
  };
}

const INLINE_COMPONENT_RE = /(^|[^\\]):([A-Za-z][A-Za-z0-9_-]*)\[([^\]]*)\]\(([^)]*)\)/g;

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

function buildInlineComponentNode(
  context: Parameters<CustomSyntaxInlineHandler["transform"]>[2],
  name: string,
  body: string,
  rawOption: string,
) {
  const definition = INLINE_COMPONENT_DEFINITIONS[name];

  if (!definition) {
    return null;
  }

  const parsedOption = parseInlineComponentParams(rawOption);

  return context.createInlineTextElement(
    definition.componentName,
    definition.buildProps({
      body,
      name,
      option: parsedOption.option,
      params: parsedOption.params,
    }),
    body,
  );
}

function isInlineLinkCandidate(node: RootContent | undefined): node is Link {
  return node?.type === "link";
}

export const inlineBadgeHandler: CustomSyntaxInlineHandler = {
  kind: "inline",
  match: (nodes, index) => {
    const current = nodes[index];
    const next = nodes[index + 1];

    if (
      current?.type === "text" &&
      /(^|[^\\]):([A-Za-z][A-Za-z0-9_-]*)$/.test(current.value) &&
      isInlineLinkCandidate(next)
    ) {
      return true;
    }

    if (current?.type !== "text") {
      return false;
    }

    INLINE_COMPONENT_RE.lastIndex = 0;
    return INLINE_COMPONENT_RE.test(current.value);
  },
  name: "inline-badge",
  transform: (nodes, index, context) => {
    const current = nodes[index];
    const next = nodes[index + 1];

    if (current?.type !== "text") {
      return { consumed: 1, nodes: current ? [current] : [] };
    }

    const markerMatch = current.value.match(/^(.*?)(?<!\\):([A-Za-z][A-Za-z0-9_-]*)$/);

    if (markerMatch && isInlineLinkCandidate(next)) {
      const leadingText = markerMatch[1] ?? "";
      const name = markerMatch[2];
      const body = extractInlineText(next.children);
      const componentNode = buildInlineComponentNode(
        context,
        name,
        body,
        next.url,
      );

      if (!componentNode) {
        return { consumed: 1, nodes: [current] };
      }

      return {
        consumed: 2,
        nodes: [
          ...(leadingText ? [context.createText(leadingText)] : []),
          componentNode,
        ],
      };
    }

    const output: RootContent[] = [];
    const source = current.value;
    let lastIndex = 0;

    INLINE_COMPONENT_RE.lastIndex = 0;

    for (const match of source.matchAll(INLINE_COMPONENT_RE)) {
      const fullMatch = match[0];
      const prefix = match[1] ?? "";
      const name = match[2];
      const body = match[3] ?? "";
      const rawOption = match[4] ?? "";
      const start = match.index ?? 0;

      const matchStart = start + prefix.length;
      const before = source.slice(lastIndex, matchStart);

      if (before) {
        output.push(context.createText(before));
      }

      const componentNode = buildInlineComponentNode(
        context,
        name,
        body,
        rawOption,
      );

      if (!componentNode) {
        continue;
      }

      output.push(componentNode);

      lastIndex = start + fullMatch.length;
    }

    if (lastIndex === 0) {
      return { consumed: 1, nodes: [current] };
    }

    const trailingText = source.slice(lastIndex);

    if (trailingText) {
      output.push(context.createText(trailingText));
    }

    return {
      consumed: 1,
      nodes: output,
    };
  },
};
