export const FOOTNOTES_HEADING_TEXT = "Footnotes";
export const FOOTNOTES_HEADING_ID = "footnote-label";

export function resolveFootnotesHeadingDepth(depths: number[]) {
  return depths.includes(1) ? 1 : 2;
}
