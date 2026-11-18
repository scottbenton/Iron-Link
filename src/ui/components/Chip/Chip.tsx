import { XIcon } from "@phosphor-icons/react";
import { ReactNode } from "react";

import { css, cva, cx } from "styled-system/css";

export type ChipTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "cursed";

const chipStyles = cva({
  base: {
    position: "relative",
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    maxWidth: "100%",
    borderRadius: "full",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--chip-border)",
    background: "var(--chip-bg)",
    color: "var(--chip-color)",
    fontFamily: "body",
    fontWeight: "medium",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
    transitionProperty: "background-color, border-color, color, transform",
    transitionDuration: "fast",
    transitionTimingFunction: "linear",
    // A clickable chip's button covers the whole chip.
    "&:has(> [data-chip-main]:hover)": { background: "var(--chip-hover)" },
    "&:has(> [data-chip-main]:active)": {
      transform: "translateY(min(var(--spacing-sink), 1px))",
      transitionDuration: "instant",
    },
    "&:has(> [data-chip-main]:focus-visible)": {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "2px",
    },
    "&:has(> [data-chip-main][aria-pressed=true])": {
      "--chip-bg": "{colors.accent.soft}",
      "--chip-hover": "{colors.accent.soft}",
      "--chip-border": "{colors.accent.fg}",
      "--chip-color": "{colors.accent.fg}",
    },
    "&:has(> [data-chip-main]:disabled)": {
      opacity: 0.55,
      transform: "none",
    },
    "& svg": { flex: "none", width: "15px", height: "15px" },
  },
  variants: {
    variant: {
      outline: {
        "--chip-bg": "{colors.bg.surface}",
        "--chip-hover": "{colors.bg.muted}",
        "--chip-border":
          "color-mix(in oklab, var(--chip-fg) 45%, token(colors.border.control))",
        "--chip-color": "var(--chip-fg)",
      },
      soft: {
        "--chip-bg": "var(--chip-soft)",
        "--chip-hover":
          "color-mix(in oklab, var(--chip-fg) 10%, var(--chip-soft))",
        "--chip-border": "color-mix(in oklab, var(--chip-fg) 22%, transparent)",
        "--chip-color": "var(--chip-fg)",
      },
      filled: {
        "--chip-bg": "var(--chip-solid)",
        "--chip-hover":
          "color-mix(in oklab, var(--chip-solid) 88%, var(--chip-on-solid))",
        "--chip-border": "var(--chip-solid)",
        "--chip-color": "var(--chip-on-solid)",
      },
    },
    tone: {
      neutral: {
        "--chip-fg": "{colors.fg.default}",
        "--chip-soft": "{colors.bg.emphasized}",
        "--chip-solid": "{colors.fg.default}",
        "--chip-on-solid": "{colors.bg.surface}",
      },
      accent: {
        "--chip-fg": "{colors.accent.fg}",
        "--chip-soft": "{colors.accent.soft}",
        "--chip-solid": "{colors.accent.solid}",
        "--chip-on-solid": "{colors.accent.onSolid}",
      },
      success: {
        "--chip-fg": "{colors.success.fg}",
        "--chip-soft": "{colors.success.soft}",
        "--chip-solid": "{colors.success.fg}",
        "--chip-on-solid": "{colors.bg.surface}",
      },
      warning: {
        "--chip-fg": "{colors.warning.fg}",
        "--chip-soft": "{colors.warning.soft}",
        "--chip-solid": "{colors.warning.fg}",
        "--chip-on-solid": "{colors.bg.surface}",
      },
      danger: {
        "--chip-fg": "{colors.danger.fg}",
        "--chip-soft": "{colors.danger.soft}",
        "--chip-solid": "{colors.danger.solid}",
        "--chip-on-solid": "{colors.danger.onSolid}",
      },
      info: {
        "--chip-fg": "{colors.info.fg}",
        "--chip-soft": "{colors.info.soft}",
        "--chip-solid": "{colors.info.fg}",
        "--chip-on-solid": "{colors.bg.surface}",
      },
      cursed: {
        "--chip-fg": "{colors.cursed.fg}",
        "--chip-soft": "{colors.cursed.soft}",
        "--chip-solid": "{colors.cursed.fg}",
        "--chip-on-solid": "{colors.bg.surface}",
      },
    },
    size: {
      sm: {
        minHeight: "24px",
        paddingInline: "2",
        fontSize: "xs",
        _touch: { minHeight: "32px" },
      },
      md: {
        minHeight: "32px",
        paddingInlineStart: "9px",
        paddingInlineEnd: "3",
        fontSize: "sm",
        _touch: { minHeight: "40px" },
      },
    },
    removable: {
      true: { paddingInlineEnd: "1" },
    },
  },
  compoundVariants: [
    {
      variant: "outline",
      tone: "neutral",
      css: { "--chip-border": "{colors.border.control}" },
    },
  ],
  defaultVariants: { variant: "outline", tone: "neutral", size: "md" },
});

const labelStyles = css({
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
});

const mainButtonStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "inherit",
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 0,
  background: "transparent",
  color: "inherit",
  font: "inherit",
  cursor: "pointer",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  // The hit area is the whole chip.
  _after: {
    content: '""',
    position: "absolute",
    inset: "-1px",
    borderRadius: "full",
  },
  _disabled: { cursor: "not-allowed" },
});

const removeStyles = css({
  position: "relative",
  zIndex: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "none",
  width: "20px",
  height: "20px",
  margin: 0,
  padding: 0,
  border: 0,
  borderRadius: "full",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  transition: "background-color token(durations.fast) linear",
  _hover: {
    background: "color-mix(in oklab, currentColor 14%, transparent)",
  },
  _active: {
    background: "color-mix(in oklab, currentColor 22%, transparent)",
  },
  _focusVisible: { outline: "2px solid token(colors.focusRing)" },
  "& svg": { width: "12px", height: "12px" },
  // A larger target for fingers, without changing the look.
  _before: {
    content: '""',
    position: "absolute",
    inset: "-6px",
    _touch: { inset: "-12px" },
  },
});

export interface ChipProps {
  /** The chip's text. */
  children: ReactNode;
  variant?: "outline" | "soft" | "filled";
  tone?: ChipTone;
  size?: "sm" | "md";
  /** An icon before the text. */
  icon?: ReactNode;
  /** Makes the chip a button. */
  onClick?: () => void;
  /** For a toggle chip: shows it chosen and sets `aria-pressed`. */
  selected?: boolean;
  disabled?: boolean;
  /** Shows a remove button after the text. */
  onRemove?: () => void;
  /** Names the remove button; defaults to "Remove" and the chip's text. */
  removeLabel?: string;
  className?: string;
}

/**
 * A compact label: a tag, a filter or a value. Clickable chips are buttons
 * (toggles with `selected`); removable chips add a named remove button.
 */
export function Chip(props: ChipProps) {
  const {
    children,
    variant,
    tone,
    size,
    icon,
    onClick,
    selected,
    disabled,
    onRemove,
    removeLabel,
    className,
  } = props;

  const content = (
    <>
      {icon && (
        <span className={css({ display: "inline-flex" })} aria-hidden>
          {icon}
        </span>
      )}
      <span className={labelStyles}>{children}</span>
    </>
  );

  return (
    <span
      className={cx(
        chipStyles({ variant, tone, size, removable: !!onRemove }),
        className,
      )}
    >
      {onClick ? (
        <button
          type="button"
          className={mainButtonStyles}
          data-chip-main=""
          aria-pressed={selected === undefined ? undefined : selected}
          disabled={disabled}
          onClick={onClick}
        >
          {content}
        </button>
      ) : (
        content
      )}
      {onRemove && (
        <button
          type="button"
          className={removeStyles}
          aria-label={
            removeLabel ??
            (typeof children === "string" ? `Remove ${children}` : "Remove")
          }
          disabled={disabled}
          onClick={onRemove}
        >
          <XIcon weight="bold" />
        </button>
      )}
    </span>
  );
}
