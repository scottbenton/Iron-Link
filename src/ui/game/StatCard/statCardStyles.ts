import { css } from "styled-system/css";

import {
  drawReveal,
  fadeReveal,
  ringHovered,
  ringLayer,
  ringShown,
  thickenReveal,
} from "../RollButton/ringStyles";

/**
 * The stat card. Rollable, it is the roll button itself: a dark filled block
 * on a ledge with a die beside the value. Its ring shows only while hovered
 * (with a real pointer), pressed or focused from the keyboard, and the page's
 * `data-ring-reveal` picks how it arrives: Fade (the default), Draw or
 * Thicken. The hidden ring is paused, so a row of cards costs nothing at rest.
 */
export const statCardBaseStyles = css({
  position: "relative",
  display: "flex",
  // Room for the longest core stat name ("Shadow") and a value with its die.
  minWidth: "var(--stat-min-width, 60px)",
  minHeight: "var(--stat-min-height, 60px)",
  padding: "2px",
  borderWidth: 0,
  borderRadius: "md",
  background: "bg.stat",
  color: "fg.onChip",
  isolation: "isolate",
  overflow: "hidden",
  textAlign: "center",
  _touch: { minHeight: "touch" },
});

export const statRollableStyles = css({
  cursor: "pointer",
  userSelect: "none",
  WebkitTapHighlightColor: "transparent",
  outline: "none",
  boxShadow: "0 var(--border-widths-ledge) 0 token(colors.border.stat)",
  transform: "translateY(0)",
  transitionProperty: "transform, box-shadow, padding",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _before: { ...ringLayer, animationPlayState: "paused" },
  _hover: {
    transform: "translateY(var(--spacing-lift))",
    boxShadow:
      "0 calc(var(--border-widths-ledge) - var(--spacing-lift)) 0 token(colors.border.stat)",
  },
  _pressed: {
    transform: "translateY(var(--spacing-sink))",
    boxShadow:
      "0 max(0px, calc(var(--border-widths-ledge) - var(--spacing-sink))) 0 token(colors.border.stat)",
    transitionDuration: "instant",
    "& > [data-stat-inner]": { background: "bg.statPressed" },
  },
  [ringShown]: { _before: { animationPlayState: "running" } },
  _hoverable: {
    [ringHovered]: { _before: { animationPlayState: "running" } },
  },

  // Fade: the ring fades in at its full 2px (140ms in, 80ms out).
  [fadeReveal]: {
    _before: {
      opacity: 0,
      transition: "opacity var(--durations-instant) linear",
    },
    [ringShown]: {
      _before: {
        opacity: 1,
        transition: "opacity var(--durations-fast) var(--easings-out)",
      },
    },
    _hoverable: {
      [ringHovered]: {
        _before: {
          opacity: 1,
          transition: "opacity var(--durations-fast) var(--easings-out)",
        },
      },
    },
  },

  // Draw: a cover in the card's colour hides the ring, and a cut in it opens
  // from the ledge and runs up both sides to meet at the top.
  [drawReveal]: {
    _after: {
      content: '""',
      position: "absolute",
      inset: 0,
      zIndex: -1,
      pointerEvents: "none",
      borderRadius: "inherit",
      background: "bg.stat",
      "--ring-reveal": "0deg",
      mask: "conic-gradient(from calc(180deg - var(--ring-reveal) / 2), transparent var(--ring-reveal), black 0)",
      WebkitMask:
        "conic-gradient(from calc(180deg - var(--ring-reveal) / 2), transparent var(--ring-reveal), black 0)",
      transition: "--ring-reveal var(--durations-fast) var(--easings-in)",
    },
    [ringShown]: {
      _after: {
        "--ring-reveal": "360deg",
        transition: "--ring-reveal var(--durations-slow) var(--easings-out)",
      },
    },
    _hoverable: {
      [ringHovered]: {
        _after: {
          "--ring-reveal": "360deg",
          transition: "--ring-reveal var(--durations-slow) var(--easings-out)",
        },
      },
    },
  },

  // Thicken: the inner layer covers the ring at rest and shrinks to show it.
  [thickenReveal]: {
    padding: 0,
    "& > [data-stat-inner]": { borderRadius: "md" },
    [ringShown]: {
      padding: "2px",
      "& > [data-stat-inner]": { borderRadius: "calc(token(radii.md) - 2px)" },
    },
    _hoverable: {
      [ringHovered]: {
        padding: "2px",
        "& > [data-stat-inner]": {
          borderRadius: "calc(token(radii.md) - 2px)",
        },
      },
    },
  },

  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "2px",
  },

  "&:is(:disabled, [data-disabled])": {
    cursor: "not-allowed",
    transform: "none",
    boxShadow: "0 var(--border-widths-ledge) 0 token(colors.border.stat)",
    opacity: 0.6,
    _before: { opacity: "0!", animationPlayState: "paused" },
    "& > [data-stat-inner]": { background: "bg.stat" },
  },
});

export const statStaticStyles = css({
  // Not pressable, so no ledge and no ring.
  boxShadow: "none",
});

export const statInnerStyles = css({
  flex: "1",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5",
  minWidth: 0,
  minHeight: 0,
  paddingBlock: "1",
  paddingInline: "1",
  borderRadius: "calc(token(radii.md) - 2px)",
  background: "bg.stat",
  transition:
    "padding var(--durations-fast) var(--easings-out), background-color var(--durations-instant) linear",
});

export const statNameStyles = css({
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  color:
    "color-mix(in oklab, token(colors.fg.onChip) 85%, token(colors.bg.stat))",
});

export const statValueStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "1.5rem",
  lineHeight: "none",
  fontVariantNumeric: "tabular-nums",
  "& svg": { width: "14px", height: "14px", opacity: 0.75, flex: "none" },
});

/**
 * The value and its adds. The adds pill follows the value and wraps under it
 * when the card is narrow, so it never covers the name or the value.
 */
export const statValueRowStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  columnGap: "1",
  rowGap: "0.5",
  maxWidth: "100%",
});
