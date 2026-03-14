import type { RootContent } from "mdast";
import type { CustomSyntaxBlockHandler } from "@/lib/content/custom-syntax/types";
import {
  BLOCK_END_RE,
  YAML_BODY_SPLIT_RE,
} from "@/lib/content/custom-syntax/utils";

const TABS_START_RE = /^::tabs\s*$/i;

function findTabsEnd(lines: string[], startLine: number) {
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

    if (TABS_START_RE.test(current)) {
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

function splitTabSections(value: string) {
  const lines = value.split(/\r?\n/);
  const sections: string[] = [];
  let currentSection: string[] = [];
  let yamlSource = "";
  let yamlCaptured = false;
  let inInnerFence: "```" | "~~~" | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (inInnerFence) {
      if (trimmed.startsWith(inInnerFence)) {
        inInnerFence = null;
      }
      currentSection.push(line);
      continue;
    }

    if (trimmed.startsWith("```")) {
      inInnerFence = "```";
      currentSection.push(line);
      continue;
    }
    if (trimmed.startsWith("~~~")) {
      inInnerFence = "~~~";
      currentSection.push(line);
      continue;
    }

    if (YAML_BODY_SPLIT_RE.test(line)) {
      if (!yamlCaptured) {
        yamlSource = currentSection.join("\n");
        yamlCaptured = true;
      } else {
        sections.push(currentSection.join("\n"));
      }
      currentSection = [];
      continue;
    }

    currentSection.push(line);
  }

  sections.push(currentSection.join("\n"));

  return {
    sections,
    yamlSource,
  };
}

export const tabsBlockHandler: CustomSyntaxBlockHandler = {
  kind: "container",
  match: ({ children, index, getNodeSource }) => {
    const node = children[index];

    if (!node) {
      return false;
    }

    const snippet = getNodeSource(node);
    const firstLine = snippet.split(/\r?\n/, 1)[0]?.trim() ?? "";
    return TABS_START_RE.test(firstLine);
  },
  name: "tabs-block",
  priority: 20,
  transform: (context) => {
    const node = context.children[context.index];
    const startLine = node.position?.start?.line;

    if (!startLine) {
      return { consumed: 1, nodes: [node] };
    }

    const openingLine = context.getLine(startLine).trim();

    if (!TABS_START_RE.test(openingLine)) {
      return { consumed: 1, nodes: [node] };
    }

    const endLine = findTabsEnd(context.lines, startLine);

    if (endLine === -1) {
      throw new Error(`Unclosed "::tabs" block at line ${startLine}`);
    }

    const blockLines = context.lines.slice(startLine, endLine - 1);
    const { sections, yamlSource } = splitTabSections(blockLines.join("\n"));
    const props = context.parseYamlProps(yamlSource);
    const labels = Array.isArray(props.tabs) ? props.tabs : [];
    delete props.tabs;

    const tabsData = sections
      .map((section) => section.trim())
      .filter((section, index) => section.length > 0 || index < labels.length)
      .map((section, index) => ({
        content: section,
        label:
          typeof labels[index] === "string"
            ? labels[index]
            : `Tab ${index + 1}`,
        value: `tab-${index}`,
      }));

    if (tabsData.length === 0) {
      return {
        consumed: context.consumeThroughLine(endLine),
        nodes: [],
      };
    }

    const defaultValue =
      typeof props.defaultValue === "string"
        ? props.defaultValue
        : (tabsData[0]?.value ?? "");
    const tabsProps = { ...props, defaultValue };

    const tabsListChildren: RootContent[] = tabsData.map((tab) =>
      context.createFlowElement("TabsTrigger", { value: tab.value }, [
        context.createText(tab.label),
      ]),
    );

    const tabsContentChildren: RootContent[] = tabsData.map((tab) =>
      context.createFlowElement("TabsContent", { value: tab.value }, [
        ...context.transformFragment(tab.content),
      ]),
    );

    return {
      consumed: context.consumeThroughLine(endLine),
      nodes: [
        context.createFlowElement("Tabs", tabsProps, [
          context.createFlowElement("TabsList", {}, tabsListChildren),
          ...tabsContentChildren,
        ]),
      ],
    };
  },
};
