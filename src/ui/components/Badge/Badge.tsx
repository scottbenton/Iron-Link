import { ReactNode } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cva, cx } from "styled-system/css";

const wrapperStyles = css({
  position: "relative",
  display: "inline-flex",
  flex: "none",
  verticalAlign: "middle",
});

const badgeStyles = cva({
  base: {
    position: "absolute",
    top: "0",
    right: "0",
    translate: "35% -35%",
    zIndex: 1,
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "full",
    background: "var(--badge-bg)",
    color: "var(--badge-fg)",
    // Separates the badge from the icon under it.
    boxShadow: "0 0 0 2px token(colors.bg.surface)",
    fontFamily: "body",
    fontWeight: "semibold",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
    pointerEvents: "none",
    transitionProperty: "scale, opacity",
    transitionDuration: "fast",
    transitionTimingFunction: "out",
    "&[data-hidden]": { scale: "0", opacity: 0 },
    _reducedMotion: { transition: "none" },
  },
  variants: {
    tone: {
      accent: {
        "--badge-bg": "{colors.accent.solid}",
        "--badge-fg": "{colors.accent.onSolid}",
      },
      danger: {
        "--badge-bg": "{colors.danger.solid}",
        "--badge-fg": "{colors.danger.onSolid}",
      },
      neutral: {
        "--badge-bg": "{colors.fg.default}",
        "--badge-fg": "{colors.bg.surface}",
      },
    },
    dot: {
      true: { width: "10px", height: "10px", translate: "20% -20%" },
      false: {
        minWidth: "18px",
        height: "18px",
        paddingInline: "1",
        fontSize: "11px",
      },
    },
  },
  defaultVariants: { tone: "accent", dot: false },
});

export interface BadgeProps extends CssProp {
  /** The thing the badge marks, usually an IconButton. */
  children: ReactNode;
  count?: number;
  /** Counts above this show as "99+". */
  max?: number;
  /** A dot instead of a number, for "something new". */
  dot?: boolean;
  /** Show a count of 0; by default the badge hides at 0. */
  showZero?: boolean;
  invisible?: boolean;
  tone?: "accent" | "danger" | "neutral";
  className?: string;
}

/**
 * A count or dot on the corner of an icon. It is decorative: put the count
 * in the child's own name too, such as `label="Notifications, 3 new"`.
 */
export function Badge(props: BadgeProps) {
  const {
    children,
    count = 0,
    max = 99,
    dot = false,
    showZero = false,
    invisible = false,
    tone,
    className,
  } = withCssProp(props);

  const hidden = invisible || (!dot && count === 0 && !showZero);
  const text = count > max ? `${max}+` : String(count);

  return (
    <span className={cx(wrapperStyles, className)}>
      {children}
      <span
        className={badgeStyles({ tone, dot })}
        data-hidden={hidden ? "" : undefined}
        aria-hidden
      >
        {dot ? null : text}
      </span>
    </span>
  );
}
