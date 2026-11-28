import { css } from "styled-system/css";

import { splitOnMatches } from "./assetPickerSearch";

const markStyles = css({
  background: "accent.soft",
  color: "fg.default",
  fontWeight: "semibold",
  borderRadius: "xs",
});

export interface HighlightedTextProps {
  text: string;
  /** Lowercase; each place the text holds it is marked. */
  query: string;
}

/** The text with each place it holds the query marked. */
export function HighlightedText(props: HighlightedTextProps) {
  const { text, query } = props;
  const parts = splitOnMatches(text, query);
  if (parts.length === 1 && !parts[0].match) return text;
  return parts.map((part, index) =>
    part.match ? (
      <mark key={index} className={markStyles}>
        {part.text}
      </mark>
    ) : (
      part.text
    ),
  );
}
