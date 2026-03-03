import GithubSlugger from "github-slugger";
import type { Heading, PhrasingContent, Root } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

type TocHeading = {
  depth: 1 | 2 | 3;
  text: string;
  id: string;
};

function extractText(children: PhrasingContent[]): string {
  return children
    .map((child) => {
      if ("value" in child && typeof child.value === "string") {
        return child.value;
      }
      if ("alt" in child && typeof child.alt === "string") {
        return child.alt;
      }
      if ("children" in child && Array.isArray(child.children)) {
        return extractText(child.children as PhrasingContent[]);
      }
      return "";
    })
    .join("");
}

export function extractHeadings(markdown: string): TocHeading[] {
  const tree = unified().use(remarkParse).parse(markdown) as Root;
  const slugger = new GithubSlugger();
  const headings: TocHeading[] = [];

  visit(tree, "heading", (node: Heading) => {
    if (node.depth !== 1 && node.depth !== 2 && node.depth !== 3) {
      return;
    }

    const text = extractText(node.children).trim();

    if (!text) {
      return;
    }

    headings.push({
      depth: node.depth,
      text,
      id: slugger.slug(text),
    });
  });

  return headings;
}
