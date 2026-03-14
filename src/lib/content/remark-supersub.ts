type MdastNode = {
  type: string;
  value?: string;
  children?: MdastNode[];
};

type MdxJsxTextElementNode = {
  type: "mdxJsxTextElement";
  name: "sub" | "sup";
  attributes: [];
  children: [{ type: "text"; value: string }];
};

function isParent(
  node: MdastNode,
): node is MdastNode & { children: MdastNode[] } {
  return Array.isArray(node.children);
}

function isWhitespace(char: string | undefined) {
  return char !== undefined && /\s/.test(char);
}

function canOpenMarker(value: string, index: number, marker: "^" | "~") {
  const previousChar = value[index - 1];
  const nextChar = value[index + 1];

  if (!nextChar || isWhitespace(nextChar)) {
    return false;
  }

  if (marker === "~") {
    return previousChar !== "~" && nextChar !== "~";
  }

  return true;
}

function isValidWrappedContent(content: string) {
  return Boolean(content.trim()) && content.trim() === content;
}

function findClosingMarker(
  value: string,
  startIndex: number,
  marker: "^" | "~",
) {
  for (let index = startIndex; index < value.length; index += 1) {
    if (value[index] !== marker) {
      continue;
    }

    const previousChar = value[index - 1];
    const nextChar = value[index + 1];

    if (previousChar === "\\") {
      continue;
    }

    if (marker === "~" && (previousChar === "~" || nextChar === "~")) {
      continue;
    }

    const content = value.slice(startIndex, index);

    if (isValidWrappedContent(content)) {
      return index;
    }
  }

  return -1;
}

function createTextNode(value: string): MdastNode {
  return { type: "text", value };
}

function createWrappedNode(
  marker: "^" | "~",
  value: string,
): MdxJsxTextElementNode {
  return {
    type: "mdxJsxTextElement",
    name: marker === "^" ? "sup" : "sub",
    attributes: [],
    children: [{ type: "text", value }],
  };
}

function transformTextNode(value: string): MdastNode[] | null {
  const output: MdastNode[] = [];
  let buffer = "";
  let changed = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if ((char === "^" || char === "~") && canOpenMarker(value, index, char)) {
      const closingIndex = findClosingMarker(value, index + 1, char);

      if (closingIndex !== -1) {
        if (buffer) {
          output.push(createTextNode(buffer));
          buffer = "";
        }

        output.push(
          createWrappedNode(char, value.slice(index + 1, closingIndex)),
        );
        index = closingIndex;
        changed = true;
        continue;
      }
    }

    buffer += char;
  }

  if (!changed) {
    return null;
  }

  if (buffer) {
    output.push(createTextNode(buffer));
  }

  return output;
}

function transformNode(node: MdastNode) {
  if (!isParent(node)) {
    return;
  }

  const nextChildren: MdastNode[] = [];

  for (const child of node.children) {
    if (child.type === "text" && typeof child.value === "string") {
      const transformed = transformTextNode(child.value);

      if (transformed) {
        nextChildren.push(...transformed);
        continue;
      }
    }

    transformNode(child);
    nextChildren.push(child);
  }

  node.children = nextChildren;
}

export function remarkSuperSub() {
  return (tree: MdastNode) => {
    transformNode(tree);
  };
}
