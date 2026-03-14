import type { RootContent } from "mdast";
import type { CustomSyntaxBlockHandler } from "@/lib/content/custom-syntax/types";
import { YAML_BODY_SPLIT_RE } from "@/lib/content/custom-syntax/utils";

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

export const tabsFenceHandler: CustomSyntaxBlockHandler = {
  kind: "container",
  match: ({ children, index }) => {
    const node = children[index];
    return node?.type === "code" && node.lang === "tab";
  },
  name: "tabs-fence",
  priority: 5,
  transform: (context) => {
    const node = context.children[context.index];

    if (node?.type !== "code" || node.lang !== "tab") {
      return { consumed: 1, nodes: node ? [node] : [] };
    }

    const { sections, yamlSource } = splitTabSections(node.value);
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
      return { consumed: 1, nodes: [] };
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
      consumed: 1,
      nodes: [
        context.createFlowElement("Tabs", tabsProps, [
          context.createFlowElement("TabsList", {}, tabsListChildren),
          ...tabsContentChildren,
        ]),
      ],
    };
  },
};
