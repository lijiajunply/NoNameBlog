const RUBY_PATTERN = /\[([^\]\n]+)\](?:\{([^}\n]+)\}|\^\(([^)\n]+)\))/g;
const RUBY_SEGMENT_SPLIT = /[・．。-]/;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildRubyHtml(base: string, ruby: string) {
  const baseCharacters = Array.from(base);
  const rubySegments = ruby.split(RUBY_SEGMENT_SPLIT);
  const canSplitPerCharacter =
    RUBY_SEGMENT_SPLIT.test(ruby) &&
    rubySegments.every((segment) => segment.trim().length > 0) &&
    rubySegments.length <= baseCharacters.length;

  if (!canSplitPerCharacter) {
    return `<ruby>${escapeHtml(base)}<rt>${escapeHtml(ruby)}</rt></ruby>`;
  }

  let characterIndex = 0;
  const htmlParts: string[] = [];

  for (const [index, segment] of rubySegments.entries()) {
    const isLastSegment = index === rubySegments.length - 1;
    const baseSliceLength = isLastSegment
      ? baseCharacters.length - characterIndex
      : 1;
    const baseSlice = baseCharacters
      .slice(characterIndex, characterIndex + baseSliceLength)
      .join("");

    htmlParts.push(`${escapeHtml(baseSlice)}<rt>${escapeHtml(segment)}</rt>`);
    characterIndex += baseSliceLength;
  }

  return `<ruby>${htmlParts.join("")}</ruby>`;
}

function transformPlainText(text: string) {
  RUBY_PATTERN.lastIndex = 0;

  return text.replaceAll(
    RUBY_PATTERN,
    (_, rawBase: string, rubyA?: string, rubyB?: string) => {
      const base = rawBase.trim();
      const ruby = (rubyA ?? rubyB ?? "").trim();

      if (!base || !ruby) {
        return _;
      }

      return buildRubyHtml(base, ruby);
    },
  );
}

export function preprocessRubySyntax(source: string) {
  const lines = source.split("\n");
  const nextLines: string[] = [];

  let inFencedCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trimStart();

    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      inFencedCodeBlock = !inFencedCodeBlock;
      nextLines.push(line);
      continue;
    }

    if (inFencedCodeBlock) {
      nextLines.push(line);
      continue;
    }

    let transformedLine = "";
    let inlineCodeDelimiterCount = 0;
    let segmentStart = 0;

    for (let index = 0; index < line.length; index += 1) {
      if (line[index] !== "`") {
        continue;
      }

      const plainSegment = line.slice(segmentStart, index);
      transformedLine +=
        inlineCodeDelimiterCount % 2 === 0
          ? transformPlainText(plainSegment)
          : plainSegment;

      let delimiterEnd = index + 1;
      while (delimiterEnd < line.length && line[delimiterEnd] === "`") {
        delimiterEnd += 1;
      }

      transformedLine += line.slice(index, delimiterEnd);
      inlineCodeDelimiterCount += 1;
      segmentStart = delimiterEnd;
      index = delimiterEnd - 1;
    }

    const trailingSegment = line.slice(segmentStart);
    transformedLine +=
      inlineCodeDelimiterCount % 2 === 0
        ? transformPlainText(trailingSegment)
        : trailingSegment;

    nextLines.push(transformedLine);
  }

  return nextLines.join("\n");
}
