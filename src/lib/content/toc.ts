import GithubSlugger from "github-slugger";
import type { Heading, PhrasingContent, Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import {
  FOOTNOTES_HEADING_ID,
  FOOTNOTES_HEADING_TEXT,
  resolveFootnotesHeadingDepth,
} from "@/lib/content/footnotes";
import type { PostHeading } from "@/types/content";

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

export function extractHeadings(markdown: string): PostHeading[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  const slugger = new GithubSlugger();
  const headings: PostHeading[] = [];
  let hasFootnotes = false;

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

  visit(tree, "footnoteDefinition", () => {
    hasFootnotes = true;
  });

  if (hasFootnotes) {
    headings.push({
      depth: resolveFootnotesHeadingDepth(headings.map((heading) => heading.depth)),
      text: FOOTNOTES_HEADING_TEXT,
      id: FOOTNOTES_HEADING_ID,
    });
  }

  return headings;
}
