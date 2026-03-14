import { visit } from "unist-util-visit";
import {
  FOOTNOTES_HEADING_ID,
  FOOTNOTES_HEADING_TEXT,
  resolveFootnotesHeadingDepth,
} from "@/lib/content/footnotes";

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

function hasFootnotesSection(node: HastNode) {
  return (
    node.tagName === "section" &&
    Object.prototype.hasOwnProperty.call(node.properties ?? {}, "dataFootnotes")
  );
}

function removeSrOnlyClass(className: unknown) {
  if (typeof className === "string") {
    return className
      .split(/\s+/)
      .filter((name) => name && name !== "sr-only");
  }

  if (Array.isArray(className)) {
    return className.filter((name) => `${name}` !== "sr-only");
  }

  return className;
}

function isHeadingTag(tagName: string | undefined) {
  return tagName === "h1" || tagName === "h2" || tagName === "h3";
}

function resolveHeadingTagName(tree: HastNode) {
  const depths: number[] = [];

  visit(tree, "element", (node: HastNode) => {
    if (!isHeadingTag(node.tagName)) {
      return;
    }

    const depth = Number(node.tagName.slice(1));
    if (!Number.isNaN(depth)) {
      depths.push(depth);
    }
  });

  return `h${resolveFootnotesHeadingDepth(depths)}`;
}

function createHeadingNode(tagName: "h1" | "h2"): HastNode {
  return {
    type: "element",
    tagName,
    properties: {
      id: FOOTNOTES_HEADING_ID,
    },
    children: [
      {
        type: "text",
        value: FOOTNOTES_HEADING_TEXT,
      },
    ],
  };
}

export function rehypeFootnotesHeading() {
  return (tree: HastNode) => {
    const headingTagName = resolveHeadingTagName(tree) as "h1" | "h2";

    visit(tree, "element", (node: HastNode) => {
      if (!hasFootnotesSection(node)) {
        return;
      }

      node.children = node.children ?? [];

      const existingHeading = node.children.find(
        (child) =>
          child.type === "element" &&
          (child.tagName === "h1" || child.tagName === "h2") &&
          child.properties?.id === FOOTNOTES_HEADING_ID,
      );

      if (existingHeading) {
        existingHeading.tagName = headingTagName;
        existingHeading.properties = {
          ...existingHeading.properties,
          className: removeSrOnlyClass(existingHeading.properties?.className),
          id: FOOTNOTES_HEADING_ID,
        };
        existingHeading.children = [
          {
            type: "text",
            value: FOOTNOTES_HEADING_TEXT,
          },
        ];
        return;
      }

      node.children.unshift(createHeadingNode(headingTagName));
    });
  };
}
