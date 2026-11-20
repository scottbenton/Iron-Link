import { CSSProperties } from "react";

import { SchemeName, ringGradient, schemes } from "ui/theme";

import { css } from "styled-system/css";

/** The scheme's ring around a dark chip, small: the picker's swatch. */
const miniSwatchStyles = css({
  flex: "none",
  display: "inline-grid",
  width: "18px",
  height: "18px",
  padding: "2px",
  borderRadius: "sm",
  background: "var(--swatch-ring)",
  verticalAlign: "middle",
  "& > span": {
    borderRadius: "calc(token(radii.sm) - 2px)",
    background: "bg.chip",
  },
});

export function SchemeSwatch(props: { scheme: SchemeName }) {
  const { scheme } = props;
  return (
    <span
      className={miniSwatchStyles}
      style={
        { "--swatch-ring": ringGradient(schemes[scheme]) } as CSSProperties
      }
      aria-hidden
    >
      <span />
    </span>
  );
}
