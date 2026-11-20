import { CSSProperties, ReactNode } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

import { RollCritical } from "../RollCard/rollTypes";
import { DieShapeSvg } from "./DieShapeSvg";
import { strikeStyles } from "./strikeStyles";

/**
 * A die. The shape is drawn in SVG behind the number: a rounded square for
 * the d6, a kite for a d10, a wide plate for a d100. A second, larger shape
 * draws the ring around a match: green on a strong hit with a match, red on
 * a miss with a match, the accent colour on an oracle match.
 */
const dieStyles = css({
  position: "relative",
  display: "inline-grid",
  placeItems: "center",
  flex: "none",
  height: "var(--die-size)",
  minWidth: "var(--die-size)",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "var(--die-font)",
  lineHeight: "none",
  verticalAlign: "middle",
  "--die-fill": "{colors.bg.emphasized}",
  "--die-stroke": "{colors.border.control}",
  "--die-fg": "{colors.fg.default}",
  "--die-ring": "{colors.accent.fg}",
  color: "var(--die-fg)",
  "&[data-size=xs]": { "--die-size": "22px", "--die-font": "0.8125rem" },
  "&[data-size=sm]": { "--die-size": "26px", "--die-font": "0.9375rem" },
  "&[data-size=md]": { "--die-size": "32px", "--die-font": "1.0625rem" },
  "& > svg": {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    overflow: "visible",
  },
  "& > svg > [data-face]": {
    fill: "var(--die-fill)",
    stroke: "var(--die-stroke)",
    strokeWidth: 1.5,
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
  },
  "& > svg > [data-ring]": {
    fill: "none",
    stroke: "var(--die-ring)",
    strokeWidth: 2,
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
  },
  "& > span": { position: "relative" },
  "&[data-shape=d100]": { minWidth: "calc(var(--die-size) * 1.35)" },
  // The action die matches the progress score's chip: the emphasized fill,
  // no outline.
  "&[data-kind=action]": { "--die-stroke": "{colors.bg.emphasized}" },
  "&[data-state=beaten]": {
    "--die-fill": "{colors.success.soft}",
    "--die-stroke": "color-mix(in oklab, {colors.success.fg} 55%, transparent)",
    "--die-fg": "{colors.success.fg}",
  },
  "&[data-state=held]": {
    "--die-fill": "{colors.danger.soft}",
    "--die-stroke": "color-mix(in oklab, {colors.danger.fg} 55%, transparent)",
    "--die-fg": "{colors.danger.fg}",
  },
  // A colour of the caller's (Sundered Isles' cinder and wraith): a beaten
  // die is solid in it, a held one only outlined, so the status still reads.
  "&[data-hue][data-state=beaten]": {
    "--die-fill": "var(--die-hue)",
    "--die-stroke": "var(--die-hue)",
    "--die-fg": "{colors.bg.surface}",
  },
  "&[data-hue][data-state=held]": {
    "--die-fill":
      "color-mix(in oklab, var(--die-hue) 10%, {colors.bg.surface})",
    "--die-stroke": "var(--die-hue)",
    "--die-fg": "var(--die-hue)",
  },
  "&[data-state=cursed]": {
    "--die-fill": "{colors.cursed.soft}",
    "--die-stroke": "{colors.cursed.fg}",
    "--die-fg": "{colors.cursed.fg}",
  },
  "&[data-state=quiet]": {
    "--die-fill": "transparent",
    "--die-stroke": "{colors.border.default}",
    "--die-fg": "{colors.fg.muted}",
  },
  // Negative momentum matched the action die, so it counts as zero.
  // Two attributes, so it outranks `data-kind=action` whatever the order.
  "&[data-cancelled][data-kind]": {
    "--die-fill": "{colors.danger.soft}",
    "--die-stroke": "{colors.danger.fg}",
    "--die-fg": "{colors.danger.fg}",
    "& > span": strikeStyles,
  },
  "&[data-ring=high]": { "--die-ring": "{colors.success.fg}" },
  "&[data-ring=low]": { "--die-ring": "{colors.danger.fg}" },
});

export type DieShape = "d6" | "d10" | "d100";

export interface DieProps extends CssProp {
  value: ReactNode;
  shape: DieShape;
  kind?: "action" | "challenge" | "oracle";
  /**
   * `beaten` and `held` colour a challenge die by the score; `cursed` is a
   * 10 on the cursed die; `quiet` is a cursed die short of 10.
   */
  state?: "beaten" | "held" | "cursed" | "quiet";
  /** Draws the match ring: `high` green, `low` red, `match` the accent. */
  ring?: RollCritical | "match";
  /** Strikes the die out: negative momentum cancelled it. */
  cancelled?: boolean;
  /**
   * A colour for the die in place of the status colours, as any CSS colour
   * (`var(--colors-danger-fg)`). Beaten dice fill with it, held ones are
   * outlined in it.
   */
  color?: string;
  /** Overrides the size from the surrounding `DiceDisplay`. */
  size?: "xs" | "sm" | "md";
  className?: string;
}

/** One die, decorative. Something nearby must say what it shows. */
export function Die(props: DieProps) {
  const { value, shape, kind, state, ring, cancelled, color, size, className } =
    withCssProp(props);
  return (
    <span
      className={cx(dieStyles, className)}
      data-shape={shape}
      data-kind={kind}
      data-state={state}
      data-ring={ring}
      data-cancelled={cancelled || undefined}
      data-hue={color ? "" : undefined}
      data-size={size}
      style={color ? ({ "--die-hue": color } as CSSProperties) : undefined}
      aria-hidden
    >
      <DieShapeSvg shape={shape} ring={!!ring} />
      <span data-term-value="">{value}</span>
    </span>
  );
}
