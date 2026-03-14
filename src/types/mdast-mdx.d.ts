import type { RootContent, Text } from "mdast";

declare module "mdast" {
  interface MdxJsxAttribute {
    type: "mdxJsxAttribute";
    name: string;
    value: string | null;
  }

  interface MdxJsxFlowElement {
    type: "mdxJsxFlowElement";
    name: string;
    attributes: MdxJsxAttribute[];
    children: RootContent[];
  }

  interface MdxJsxTextElement {
    type: "mdxJsxTextElement";
    name: string;
    attributes: MdxJsxAttribute[];
    children: Text[];
  }

  interface RootContentMap {
    mdxJsxFlowElement: MdxJsxFlowElement;
    mdxJsxTextElement: MdxJsxTextElement;
  }

  interface PhrasingContentMap {
    mdxJsxTextElement: MdxJsxTextElement;
  }
}
