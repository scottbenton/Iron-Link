import { css, cva } from "styled-system/css";

/**
 * The soft halo a focused field wears around its accent border, from the
 * Workbench: the focus ring colour at 30% over whatever is behind it.
 */
const focusHalo =
  "0 0 0 3px color-mix(in oklab, token(colors.focusRing) 30%, transparent)";
const dangerHalo =
  "0 0 0 3px color-mix(in oklab, token(colors.danger.fg) 28%, transparent)";

/** States in which a field does not answer hover. */
const inactive = "[data-disabled], [data-readonly]";
const invalidish =
  "[data-invalid], :has([data-invalid]), :has([aria-invalid=true])";

/**
 * The inset well every field sits in: text fields, select triggers, the
 * combobox's input group and the number field. It sinks into the page
 * (`bg.field` with `shadows.field`), takes an accent border and a soft focus
 * halo when focused, and a danger border when invalid. Text fields, selects
 * and number fields share one height so a form row lines up.
 *
 * `kind: "input"` marks focus with `:focus-within`, for a wrapper around an
 * input. `kind: "button"` marks it with `:focus-visible` and the open state,
 * for a trigger that is itself the well.
 */
export const fieldShellStyles = cva({
  base: {
    boxSizing: "border-box",
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "2",
    width: "100%",
    minWidth: 0,
    minHeight: "40px",
    margin: 0,
    paddingInline: "3",
    borderRadius: "md",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.control",
    background: "bg.field",
    boxShadow: "field",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "md",
    fontWeight: "normal",
    lineHeight: "normal",
    textAlign: "start",
    transitionProperty: "border-color, background-color, box-shadow",
    transitionDuration: "fast",
    transitionTimingFunction: "linear",
    WebkitTapHighlightColor: "transparent",
    // Hover darkens the border of a field that is idle and editable.
    [`&:hover:not(${inactive}, :focus-within, ${invalidish})`]: {
      borderColor: "fg.muted",
    },
    // Invalid: a danger border, and a danger halo while focused.
    "&[data-invalid], &:has([data-invalid]), &:has([aria-invalid=true])": {
      borderColor: "danger.fg",
    },
    // Disabled: flat, no well, muted text.
    "&[data-disabled], &:has(> :is(input, textarea):disabled)": {
      cursor: "not-allowed",
      background: "bg.muted",
      borderColor: "border.default",
      boxShadow: "none",
      color: "fg.disabled",
    },
    // Read-only: still focusable and selectable, but visibly not editable.
    "&[data-readonly], &:has(> :is(input, textarea)[readonly])": {
      background: "bg.muted",
      borderColor: "border.default",
      boxShadow: "none",
    },
    _touch: { minHeight: "touch" },
  },
  variants: {
    kind: {
      input: {
        cursor: "text",
        "&:focus-within": {
          background: "bg.surface",
          borderColor: "accent.fg",
          boxShadow: `token(shadows.field), ${focusHalo}`,
        },
        "&:focus-within[data-invalid], &:focus-within:has([data-invalid]), &:focus-within:has([aria-invalid=true])":
          {
            borderColor: "danger.fg",
            boxShadow: `token(shadows.field), ${dangerHalo}`,
          },
      },
      button: {
        appearance: "none",
        justifyContent: "space-between",
        cursor: "pointer",
        outline: "none",
        userSelect: "none",
        [`&:hover:not(${inactive}, [data-popup-open])`]: {
          background:
            "color-mix(in oklab, token(colors.bg.field) 70%, token(colors.bg.surface))",
        },
        "&:is(:focus-visible, [data-popup-open], [aria-expanded=true])": {
          background: "bg.surface",
          borderColor: "accent.fg",
          boxShadow: `token(shadows.field), ${focusHalo}`,
        },
        "&:is(:focus-visible, [data-popup-open], [aria-expanded=true]):is([data-invalid], [aria-invalid=true])":
          {
            borderColor: "danger.fg",
            boxShadow: `token(shadows.field), ${dangerHalo}`,
          },
      },
    },
    size: {
      sm: {
        minHeight: "32px",
        paddingInline: "10px",
        fontSize: "sm",
        gap: "1.5",
        // 16px text keeps iOS from zooming into a focused field.
        _touch: { minHeight: "40px", fontSize: "md" },
      },
      md: {},
    },
  },
  defaultVariants: { kind: "input", size: "md" },
});

/** The bare input or textarea inside a field well. */
export const fieldInputStyles = css({
  boxSizing: "border-box",
  flex: "1 1 auto",
  alignSelf: "stretch",
  minWidth: 0,
  width: "100%",
  margin: 0,
  padding: 0,
  border: 0,
  outline: "none",
  background: "transparent",
  color: "inherit",
  font: "inherit",
  letterSpacing: "inherit",
  textOverflow: "ellipsis",
  _placeholder: { color: "fg.subtle", opacity: 1 },
  _disabled: {
    cursor: "not-allowed",
    color: "fg.disabled",
    WebkitTextFillColor: "currentColor",
  },
  // The native search clear button; SearchField draws its own.
  "&::-webkit-search-cancel-button, &::-webkit-search-decoration": {
    appearance: "none",
  },
});

/** An icon, unit or button at either end of a field well. */
export const fieldAdornmentStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  flex: "none",
  color: "fg.muted",
  fontSize: "sm",
  lineHeight: "none",
  whiteSpace: "nowrap",
  "& > svg": { width: "18px", height: "18px", flex: "none" },
  "[data-disabled] &, :disabled ~ &": { color: "fg.disabled" },
});

/**
 * A small ghost button inside a field well: the clear button, the select
 * caret, the number field's steppers. No ledge, so it answers press with
 * `overlay.pressed` and never moves.
 */
export const fieldIconButtonStyles = css({
  boxSizing: "border-box",
  appearance: "none",
  display: "inline-grid",
  placeItems: "center",
  flex: "none",
  width: "26px",
  height: "26px",
  margin: 0,
  padding: 0,
  border: 0,
  borderRadius: "sm",
  background: "transparent",
  color: "fg.muted",
  cursor: "pointer",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  transitionProperty: "background-color, color",
  transitionDuration: "fast",
  transitionTimingFunction: "linear",
  "& > svg": { width: "16px", height: "16px" },
  _hover: { background: "overlay.hover", color: "fg.default" },
  _pressed: { background: "overlay.pressed", transitionDuration: "instant" },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "1px",
  },
  "&:is(:disabled, [data-disabled])": {
    cursor: "not-allowed",
    color: "fg.disabled",
    background: "transparent",
  },
  _touch: { width: "36px", height: "36px" },
});

/** A field's label: small, semibold body text above the control. */
export const fieldLabelStyles = css({
  display: "block",
  margin: 0,
  fontFamily: "body",
  fontSize: "sm",
  fontWeight: "semibold",
  lineHeight: "snug",
  color: "fg.default",
  cursor: "default",
  "&[data-disabled]": { color: "fg.subtle" },
});

/** The required marker after a label. Decorative: the control says required. */
export const fieldRequiredStyles = css({
  marginInlineStart: "0.5",
  color: "danger.fg",
  fontWeight: "semibold",
});

/** Help text under a control. */
export const fieldDescriptionStyles = css({
  margin: 0,
  fontFamily: "body",
  fontSize: "xs",
  lineHeight: "snug",
  color: "fg.muted",
});

/**
 * An error under a control. It rises in gently when it appears and fades out
 * faster when it goes, through Base UI's starting and ending styles.
 */
export const fieldErrorStyles = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "1",
  margin: 0,
  fontFamily: "body",
  fontSize: "xs",
  fontWeight: "medium",
  lineHeight: "snug",
  color: "danger.fg",
  transitionProperty: "opacity, translate",
  transitionDuration: "normal",
  transitionTimingFunction: "out",
  "& > svg": { flex: "none", width: "14px", height: "14px", marginTop: "1px" },
  "& ul": { margin: 0, paddingInlineStart: "4" },
  _startingStyle: { opacity: 0, translate: "0 -4px" },
  _endingStyle: {
    opacity: 0,
    translate: "0 -2px",
    transitionDuration: "fast",
    transitionTimingFunction: "in",
  },
  _reducedMotion: {
    _startingStyle: { translate: "0 0" },
    _endingStyle: { translate: "0 0" },
  },
});

/** The grid a field stacks its label, control, help and error in. */
export const fieldRootStyles = css({
  boxSizing: "border-box",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  alignContent: "start",
  gap: "1.5",
  minWidth: 0,
  margin: 0,
  border: 0,
  padding: 0,
});

/** A label row that also holds something at its end, such as a value. */
export const fieldLabelRowStyles = css({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "3",
  minWidth: 0,
});
