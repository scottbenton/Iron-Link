import { XIcon } from "@phosphor-icons/react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { CssProp, withCssProp } from "ui/styles/cssProp";
import { focusRing } from "ui/styles/focus";

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
    transitionProperty: "background-color, border-color, color",
    transitionDuration: "fast",
    transitionTimingFunction: "linear",
    // A clickable chip's button covers the whole chip. Chips have no ledge,
    // so a press darkens the fill instead of sinking the chip.
    "&:has(> [data-chip-main]:hover)": { background: "var(--chip-hover)" },
    "&:has(> [data-chip-main]:active)": {
      background:
        "color-mix(in oklab, var(--chip-hover) 88%, var(--chip-color))",
      transitionDuration: "instant",
    },
    "&:has(> [data-chip-main]:focus-visible)": focusRing.outset,
    "&:has(> [data-chip-main][aria-pressed=true])": {
      "--chip-bg": "{colors.accent.soft}",
      "--chip-hover": "{colors.accent.soft}",
      "--chip-border": "{colors.accent.fg}",
      "--chip-color": "{colors.accent.fg}",
    },
    "&:has(> [data-chip-main]:disabled)": {
      opacity: 0.55,
      background: "var(--chip-bg)",
    },
    // The leading icon only; the remove button sizes its own.
    "& [data-chip-icon] svg": { flex: "none", width: "15px", height: "15px" },
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
    },
    tone: {
      neutral: {
        "--chip-fg": "{colors.fg.default}",
        "--chip-soft": "{colors.bg.emphasized}",
      },
      accent: {
        "--chip-fg": "{colors.accent.fg}",
        "--chip-soft": "{colors.accent.soft}",
      },
      success: {
        "--chip-fg": "{colors.success.fg}",
        "--chip-soft": "{colors.success.soft}",
      },
      warning: {
        "--chip-fg": "{colors.warning.fg}",
        "--chip-soft": "{colors.warning.soft}",
      },
      danger: {
        "--chip-fg": "{colors.danger.fg}",
        "--chip-soft": "{colors.danger.soft}",
      },
      info: {
        "--chip-fg": "{colors.info.fg}",
        "--chip-soft": "{colors.info.soft}",
      },
      cursed: {
        "--chip-fg": "{colors.cursed.fg}",
        "--chip-soft": "{colors.cursed.soft}",
      },
    },
    size: {
      sm: {
        "--chip-remove-size": "16px",
        "--chip-remove-icon": "10px",
        minHeight: "24px",
        paddingInline: "2",
        fontSize: "xs",
        _touch: { minHeight: "control.sm" },
      },
      md: {
        "--chip-remove-size": "20px",
        "--chip-remove-icon": "12px",
        minHeight: "control.sm",
        paddingInline: "3",
        fontSize: "sm",
        _touch: { minHeight: "control.md" },
      },
    },
    removable: {
      true: {},
    },
  },
  compoundVariants: [
    // A leading icon is a square, so it sits a little closer to the edge
    // than a letter would; text-only chips keep even padding.
    {
      size: "sm",
      css: { "&:has([data-chip-icon])": { paddingInlineStart: "6px" } },
    },
    {
      size: "md",
      css: { "&:has([data-chip-icon])": { paddingInlineStart: "9px" } },
    },
    {
      variant: "outline",
      tone: "neutral",
      css: { "--chip-border": "{colors.border.control}" },
    },
    // The remove button's circle sits as far from the chip's end as from
    // its top and bottom, so it follows the pill's round end:
    // (height - border - button) / 2.
    { removable: true, size: "sm", css: { paddingInlineEnd: "3px" } },
    { removable: true, size: "md", css: { paddingInlineEnd: "5px" } },
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
  width: "var(--chip-remove-size)",
  height: "var(--chip-remove-size)",
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
  _focusVisible: focusRing.outset,
  "& svg": {
    width: "var(--chip-remove-icon)",
    height: "var(--chip-remove-icon)",
  },
  // A larger target for fingers, without changing the look.
  _before: {
    content: '""',
    position: "absolute",
    inset: "-6px",
    _touch: { inset: "-12px" },
  },
});

export interface ChipProps extends CssProp {
  /** The chip's text. */
  children: ReactNode;
  variant?: "outline" | "soft";
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
  const { t } = useTranslation();
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
  } = withCssProp(props);

  const content = (
    <>
      {icon && (
        <span
          className={css({ display: "inline-flex" })}
          data-chip-icon=""
          aria-hidden
        >
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
            (typeof children === "string"
              ? t("ui.chip.remove-named", "Remove {{label}}", {
                  label: children,
                })
              : t("ui.chip.remove", "Remove"))
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
