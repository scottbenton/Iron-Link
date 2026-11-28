import { CSSProperties } from "react";

import { SchemeName, ringGradient, schemes } from "ui/theme";

import { css, cx } from "styled-system/css";

/**
 * The scheme's ring gradient around a dark chip. `sm` sits inline with a
 * line of text (a Theme dialog row), `md` is a scheme card's picture and
 * `lg` the fallback card's.
 */
const swatchStyles = css({
  "--swatch-size": "18px",
  "--swatch-ring-width": "2px",
  "--swatch-radius": "token(radii.sm)",
  "&[data-size=md]": {
    "--swatch-size": "32px",
    "--swatch-ring-width": "4px",
    "--swatch-radius": "token(radii.md)",
  },
  "&[data-size=lg]": {
    "--swatch-size": "40px",
    "--swatch-ring-width": "5px",
    "--swatch-radius": "token(radii.md)",
  },
  flex: "none",
  display: "inline-grid",
  width: "var(--swatch-size)",
  height: "var(--swatch-size)",
  padding: "var(--swatch-ring-width)",
  borderRadius: "var(--swatch-radius)",
  background: "var(--swatch-ring)",
  verticalAlign: "middle",
  "& > span": {
    borderRadius: "calc(var(--swatch-radius) - var(--swatch-ring-width))",
    background: "bg.chip",
  },
});

export interface SchemeSwatchProps {
  scheme: SchemeName;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** A colour scheme shown as its ring gradient. Decorative: name the scheme in text beside it. */
export function SchemeSwatch(props: SchemeSwatchProps) {
  const { scheme, size = "sm", className } = props;
  return (
    <span
      className={cx(swatchStyles, className)}
      data-size={size}
      style={
        { "--swatch-ring": ringGradient(schemes[scheme]) } as CSSProperties
      }
      aria-hidden
    >
      <span />
    </span>
  );
}
