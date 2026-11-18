import { css, cva } from "styled-system/css";

import { ringLayer, thickenReveal } from "./ringStyles";

export const rollButtonStyles = cva({
  base: {
    "--ring-pad-y": "7px",
    "--ring-pad-x": "14px",
    "--ring-edge-color": "{colors.ringEdge}",
    position: "relative",
    display: "inline-flex",
    flexShrink: 0,
    padding: "2px",
    borderWidth: 0,
    borderRadius: "md",
    background: "bg.chip",
    color: "fg.onChip",
    overflow: "hidden",
    isolation: "isolate",
    cursor: "pointer",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    textDecoration: "none",
    boxShadow: "0 var(--border-widths-ledge) 0 var(--ring-edge-color)",
    transform: "translateY(0)",
    transitionProperty: "transform, box-shadow, padding",
    transitionDuration: "fast",
    transitionTimingFunction: "out",
    outline: "none",
    _focusVisible: {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "2px",
    },
    _before: ringLayer,
    _hover: {
      transform: "translateY(var(--spacing-lift))",
      boxShadow:
        "0 calc(var(--border-widths-ledge) - var(--spacing-lift)) 0 var(--ring-edge-color)",
    },
    // An always-on ring answers hover by brightening, not by changing shape.
    _hoverable: {
      _hover: { _before: { filter: "brightness(1.15) saturate(1.15)" } },
    },
    _pressed: {
      transform: "translateY(var(--spacing-sink))",
      boxShadow:
        "0 max(0px, calc(var(--border-widths-ledge) - var(--spacing-sink))) 0 var(--ring-edge-color)",
      transitionDuration: "instant",
      "& > [data-ring-inner]": { background: "bg.chipPressed" },
    },
    // Thicken: the ring grows a pixel on hover and the inner layer shrinks.
    [thickenReveal]: {
      _hoverable: {
        "&:hover:not(:disabled, [data-disabled])": {
          padding: "3px",
          "& > [data-ring-inner]": {
            padding:
              "calc(var(--ring-pad-y) - 1px) calc(var(--ring-pad-x) - 1px)",
          },
        },
      },
    },
    "&:is(:disabled, [data-disabled])": {
      cursor: "not-allowed",
      transform: "none",
      color: "color-mix(in oklab, token(colors.fg.onChip) 55%, transparent)",
      boxShadow: "0 var(--border-widths-ledge) 0 var(--ring-edge-color)",
      _before: {
        animationPlayState: "paused",
        filter: "grayscale(1)",
        opacity: 0.45,
      },
      "& > [data-ring-inner]": { background: "bg.chip" },
    },
    _touch: { minHeight: "touch" },
  },
  variants: {
    size: {
      sm: {
        "--ring-pad-y": "4px",
        "--ring-pad-x": "10px",
        fontSize: "sm",
        _touch: { minHeight: "40px" },
      },
      md: { fontSize: "1.0625rem" },
      lg: {
        "--ring-pad-y": "10px",
        "--ring-pad-x": "18px",
        fontSize: "lg",
      },
    },
    fullWidth: {
      true: { display: "flex", width: "100%" },
    },
  },
  defaultVariants: { size: "md" },
});

export const rollButtonInnerStyles = css({
  flex: "1",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "2",
  padding: "var(--ring-pad-y) var(--ring-pad-x)",
  borderRadius: "calc(token(radii.md) - 2px)",
  background: "bg.chip",
  fontFamily: "heading",
  fontWeight: "semibold",
  fontSize: "inherit",
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  lineHeight: "1.2",
  whiteSpace: "nowrap",
  transition:
    "padding var(--durations-fast) var(--easings-out), background-color var(--durations-instant) linear",
  "& svg": { flex: "none", width: "1.1em", height: "1.1em" },
});
