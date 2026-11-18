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

// Selectors the variants below override, kept in one place so an override
// replaces the base rule rather than adding a second one beside it.
const idleHover = `&:hover:not(${inactive}, :focus-within, ${invalidish})`;
const disabledState =
  "&[data-disabled], &:has(> :is(input, textarea):disabled)";
const readOnlyState =
  "&[data-readonly], &:has(> :is(input, textarea)[readonly])";
const inputFocus = "&:focus-within";
const buttonHover = `&:hover:not(${inactive}, [data-popup-open])`;
const buttonFocus =
  "&:is(:focus-visible, [data-popup-open], [aria-expanded=true])";

/**
 * How far a quiet field reaches past its column on each side (its padding
 * and its border), so its text lines up with the label above it.
 */
const quietReach = "calc(1px + token(spacing.2))";

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
    [idleHover]: {
      borderColor: "fg.muted",
    },
    // Invalid: a danger border, and a danger halo while focused.
    "&[data-invalid], &:has([data-invalid]), &:has([aria-invalid=true])": {
      borderColor: "danger.fg",
    },
    // Disabled: flat, no well, muted text.
    [disabledState]: {
      cursor: "not-allowed",
      background: "bg.muted",
      borderColor: "border.default",
      boxShadow: "none",
      color: "fg.disabled",
    },
    // Read-only: still focusable and selectable, but visibly not editable.
    [readOnlyState]: {
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
        [inputFocus]: {
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
        [buttonHover]: {
          background:
            "color-mix(in oklab, token(colors.bg.field) 70%, token(colors.bg.surface))",
        },
        [buttonFocus]: {
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
    /**
     * `quiet` has no border or well until it is hovered or focused, so a
     * value reads as text in a details panel (a world entry's fields). It
     * reaches past its column by its padding, so its text lines up with the
     * label. An invalid quiet field still shows its danger border.
     */
    variant: {
      outline: {},
      quiet: {},
    },
    /** A well around a textarea: the text starts at the top. */
    multiline: {
      true: { alignItems: "stretch" },
      false: {},
    },
    /**
     * A well holding chips and an input that wrap onto more rows (the
     * multiple Combobox). Rows are `--chip-row` tall and start at the top, so
     * buttons at the end stay on the first row however many rows there are.
     */
    chips: {
      true: {
        "--field-height": "40px",
        "--chip-row": "28px",
        alignItems: "flex-start",
        paddingInlineStart: "1.5",
        paddingBlock: "calc((var(--field-height) - 2px - var(--chip-row)) / 2)",
        _touch: {
          "--field-height": "token(sizes.touch)",
          "--chip-row": "36px",
        },
      },
      false: {},
    },
  },
  compoundVariants: [
    {
      chips: true,
      size: "sm",
      css: {
        "--field-height": "32px",
        "--chip-row": "24px",
        _touch: { "--field-height": "40px", "--chip-row": "36px" },
      },
    },
    {
      variant: "quiet",
      css: {
        width: `calc(100% + 2 * ${quietReach})`,
        marginInline: `calc(-1 * ${quietReach})`,
        paddingInline: "2",
        borderColor: "transparent",
        background: "transparent",
        boxShadow: "none",
        [idleHover]: {
          borderColor: "transparent",
          background: "overlay.hover",
        },
        [disabledState]: {
          background: "transparent",
          borderColor: "transparent",
          boxShadow: "none",
        },
        [readOnlyState]: {
          background: "transparent",
          borderColor: "transparent",
          boxShadow: "none",
        },
      },
    },
    {
      // The first chip's edge lines up with the label.
      variant: "quiet",
      chips: true,
      css: { paddingInlineStart: "2" },
    },
    {
      variant: "quiet",
      kind: "input",
      css: { [inputFocus]: { boxShadow: focusHalo } },
    },
    {
      variant: "quiet",
      kind: "button",
      css: {
        [buttonHover]: { background: "overlay.hover" },
        [buttonFocus]: { boxShadow: focusHalo },
      },
    },
  ],
  defaultVariants: {
    kind: "input",
    size: "md",
    variant: "outline",
    multiline: false,
    chips: false,
  },
});

/** The bare input or textarea inside a field well. */
export const fieldInputRecipe = cva({
  base: {
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
  },
  variants: {
    size: { sm: {}, md: {} },
    /**
     * A textarea. Its well keeps the same inline padding as a text field's,
     * so the two line up; the textarea pads only top and bottom.
     */
    multiline: {
      true: {
        display: "block",
        paddingBlock: "2",
        resize: "none",
        lineHeight: "normal",
        overflowY: "hidden",
        textOverflow: "clip",
        scrollPaddingBlock: "2",
      },
      false: {},
    },
    /** The input after the chips in a `chips` well. */
    chips: {
      true: {
        flex: "1 1 64px",
        minWidth: "64px",
        height: "var(--chip-row, 28px)",
        alignSelf: "center",
        paddingInlineStart: "1.5",
      },
      false: {},
    },
  },
  compoundVariants: [
    {
      multiline: true,
      size: "sm",
      css: { paddingBlock: "1.5", scrollPaddingBlock: "1.5" },
    },
  ],
  defaultVariants: { size: "md", multiline: false, chips: false },
});

/** The bare input inside a field well, at its default size. */
export const fieldInputStyles = fieldInputRecipe();

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

/**
 * A field's label: small, semibold body text above the control. The `sm`
 * size is the compact one for dense panels: smaller and muted, so the values
 * stand out more than their names.
 */
export const fieldLabelRecipe = cva({
  base: {
    display: "block",
    margin: 0,
    fontFamily: "body",
    fontSize: "sm",
    fontWeight: "semibold",
    lineHeight: "snug",
    color: "fg.default",
    cursor: "default",
    "&[data-disabled]": { color: "fg.subtle" },
  },
  variants: {
    size: {
      sm: { fontSize: "xs", fontWeight: "medium", color: "fg.muted" },
      md: {},
    },
  },
  defaultVariants: { size: "md" },
});

/** A field's label at the default size. */
export const fieldLabelStyles = fieldLabelRecipe();

/** The required marker after a label. Decorative: the control says required. */
export const fieldRequiredStyles = css({
  marginInlineStart: "0.5",
  color: "danger.fg",
  fontWeight: "semibold",
});

/** Help text, under the label and above the control. */
export const fieldDescriptionStyles = css({
  margin: 0,
  fontFamily: "body",
  fontSize: "xs",
  lineHeight: "snug",
  color: "fg.muted",
});

/**
 * An error, under the control. It rises in gently when it appears and fades out
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

/**
 * The grid a field stacks its label, help, control and error in. The label
 * and its help sit together in a `fieldHeaderStyles` block, so help reads as
 * part of the label and the error as part of the control.
 */
export const fieldRootRecipe = cva({
  base: {
    boxSizing: "border-box",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    alignContent: "start",
    gap: "1.5",
    minWidth: 0,
    margin: 0,
    border: 0,
    padding: 0,
  },
  variants: {
    size: { sm: { gap: "1" }, md: {} },
  },
  defaultVariants: { size: "md" },
});

/** The field grid at the default size. */
export const fieldRootStyles = fieldRootRecipe();

/** The label and its help text, held close so they read as one. */
export const fieldHeaderStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "0.5",
  minWidth: 0,
});

/** A label row that also holds something at its end, such as a value. */
export const fieldLabelRowStyles = css({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "3",
  minWidth: 0,
});

/**
 * Help text right after a fieldset's legend, in a group that stacks its
 * legend, help and choices with a `spacing.2` gap (CheckboxGroup,
 * RadioGroup, RadioCardGroup). The legend keeps `spacing.1` below it; this
 * pulls the help up past both, so it sits `spacing.0.5` under the legend
 * and reads as part of it, with the full gap before the choices.
 */
export const fieldsetDescriptionStyles = css({
  marginTop: "calc(token(spacing.0.5) - token(spacing.2) - token(spacing.1))",
});
