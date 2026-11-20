import { ReactNode } from "react";

import { css } from "styled-system/css";

const termStyles = css({
  display: "grid",
  justifyItems: "center",
  alignContent: "start",
  gap: "0.5",
  minWidth: 0,
});

/**
 * Captions wrap to two lines at most under their term, then clip with an
 * ellipsis, so a long stat ("Protocol Bot health") or table name never
 * pushes the dice apart. Screen readers read the roll's summary instead.
 */
const captionStyles = css({
  display: "none",
  maxWidth: "calc(var(--die-size) * 3)",
  fontSize: "2xs",
  lineHeight: "tight",
  color: "fg.muted",
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: "label",
  fontFamily: "heading",
  fontWeight: "bold",
  overflowWrap: "break-word",
  textWrap: "balance",
  // lineClamp sets display, so it lives only under the shown condition,
  // whose higher specificity beats the hidden default.
  "[data-captions] &": { lineClamp: 2 },
  "&[data-tone=danger]": { color: "danger.fg" },
});

export function Term(props: {
  caption?: string;
  tone?: "danger";
  children: ReactNode;
}) {
  const { caption, tone, children } = props;
  return (
    <span className={termStyles}>
      {children}
      {caption && (
        <span className={captionStyles} data-tone={tone}>
          {caption}
        </span>
      )}
    </span>
  );
}
