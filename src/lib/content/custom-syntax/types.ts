import type { RootContent, Text } from "mdast";

export type NodeWithPosition = {
  position?: {
    start?: { line?: number; offset?: number };
    end?: { line?: number; offset?: number };
  };
};

export type FlowNode = RootContent & NodeWithPosition;

export type BlockHandlerKind = "block" | "container";

export type BlockHandlerMatchContext = {
  children: FlowNode[];
  getNodeSource: (node: NodeWithPosition) => string;
  index: number;
  source: string;
  lines: string[];
};

export type BlockHandlerTransformContext = BlockHandlerMatchContext & {
  consumeThroughLine: (endLine: number) => number;
  createFlowElement: (
    name: string,
    props?: Record<string, unknown>,
    children?: RootContent[],
  ) => RootContent;
  createInlineTextElement: (
    name: string,
    props?: Record<string, unknown>,
    text?: string,
  ) => RootContent;
  createText: (value: string) => Text;
  getLine: (lineNumber: number) => string;
  getNodeSource: (node: NodeWithPosition) => string;
  parseYamlProps: (yamlSource: string) => Record<string, unknown>;
  transformFragment: (markdown: string) => RootContent[];
};

export type BlockHandlerResult = {
  consumed: number;
  nodes: RootContent[];
};

export type CustomSyntaxBlockHandler = {
  kind: BlockHandlerKind;
  match: (context: BlockHandlerMatchContext) => boolean;
  name: string;
  priority?: number;
  transform: (context: BlockHandlerTransformContext) => BlockHandlerResult;
};

export type InlineHandlerContext = {
  createInlineTextElement: (
    name: string,
    props?: Record<string, unknown>,
    text?: string,
  ) => RootContent;
  createText: (value: string) => Text;
  getNodeSource: (node: NodeWithPosition) => string;
  source: string;
};

export type CustomSyntaxInlineHandler = {
  kind: "inline";
  match: (
    nodes: RootContent[],
    index: number,
    context: InlineHandlerContext,
  ) => boolean;
  name: string;
  priority?: number;
  transform: (
    nodes: RootContent[],
    index: number,
    context: InlineHandlerContext,
  ) => {
    consumed: number;
    nodes: RootContent[];
  };
};
