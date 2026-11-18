import { cva } from "styled-system/css";

/**
 * The scheme's ring gradient as a fill white text can sit on. Each end is the
 * ring colour with its OKLCH lightness capped at 0.5, so dark hues stay as
 * they are and light ones (Eidolon's yellow, Hinterlands' mint) deepen: white
 * text keeps at least 4.5:1 at rest, on hover and pressed in every scheme.
 * The ends are read on the button itself, so a scheme set on a subtree
 * applies too. Two ends only: Pride's rainbow reads as red to violet here.
 */
const gradientEnd = (end: "start" | "end") =>
  `oklch(from {colors.ring.${end}} min(l, 0.5) c h)`;
const gradientFill = `radial-gradient(142% 91% at 111% 84%, ${gradientEnd("start")} 20%, ${gradientEnd("end")} 80%) border-box`;
const gradientOverlay = (color: string) =>
  `linear-gradient(${color}, ${color}) border-box`;

/**
 * The tactile button. It sits on a solid ledge (a bottom edge drawn with
 * box-shadow), and a press sinks it 1px onto the ledge. Colours come from
 * the --btn-* variables each variant sets, so hover and press follow the
 * variant without a rule per variant.
 */
export const buttonStyles = cva({
  base: {
    "--btn-bg": "{colors.bg.surface}",
    "--btn-fg": "{colors.fg.default}",
    "--btn-border": "{colors.border.control}",
    "--btn-edge": "{colors.border.control}",
    "--btn-hover": "{colors.bg.muted}",
    "--btn-press": "{colors.bg.emphasized}",
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2",
    flexShrink: 0,
    minHeight: "38px",
    paddingInline: "4",
    borderRadius: "md",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--btn-border)",
    background: "var(--btn-bg)",
    color: "var(--btn-fg)",
    fontFamily: "body",
    fontWeight: "semibold",
    fontSize: "sm",
    lineHeight: "1.2",
    letterSpacing: "0.005em",
    textDecoration: "none",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    boxShadow: "0 var(--border-widths-ledge) 0 var(--btn-edge)",
    transform: "translateY(0)",
    transitionProperty: "transform, box-shadow, background-color, border-color",
    transitionDuration: "fast",
    transitionTimingFunction: "out",
    outline: "none",
    _focusVisible: {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "2px",
    },
    _hover: {
      background: "var(--btn-hover)",
      transform: "translateY(var(--spacing-lift))",
      boxShadow:
        "0 calc(var(--border-widths-ledge) - var(--spacing-lift)) 0 var(--btn-edge)",
    },
    _pressed: {
      background: "var(--btn-press)",
      transform: "translateY(var(--spacing-sink))",
      boxShadow:
        "0 max(0px, calc(var(--border-widths-ledge) - var(--spacing-sink))) 0 var(--btn-edge)",
      transitionDuration: "instant",
    },
    "&:is(:disabled, [data-disabled]):not([data-busy])": {
      cursor: "not-allowed",
      transform: "none",
      background: "bg.emphasized",
      color: "fg.subtle",
      borderColor: "border.default",
      boxShadow: "0 var(--border-widths-ledge) 0 token(colors.border.default)",
    },
    "&[data-busy]": {
      cursor: "progress",
      transform: "none",
      background: "var(--btn-bg)",
      boxShadow: "0 var(--border-widths-ledge) 0 var(--btn-edge)",
    },
    "& svg": { flex: "none", width: "1.15em", height: "1.15em" },
    _touch: { minHeight: "touch" },
  },
  variants: {
    variant: {
      /** Outlined, for most actions. */
      outline: {},
      /** The one main action in a place. */
      primary: {
        "--btn-bg": "{colors.accent.solid}",
        "--btn-fg": "{colors.accent.onSolid}",
        "--btn-border": "{colors.accent.solid}",
        "--btn-edge": "{colors.accent.edge}",
        "--btn-hover": "{colors.accent.solidHover}",
        "--btn-press": "{colors.accent.solidPressed}",
      },
      /** A destructive action, usually the confirm in a confirm dialog. */
      danger: {
        "--btn-bg": "{colors.danger.solid}",
        "--btn-fg": "{colors.danger.onSolid}",
        "--btn-border": "{colors.danger.solid}",
        "--btn-edge": "{colors.danger.edge}",
        "--btn-hover": "{colors.danger.solidHover}",
        "--btn-press": "{colors.danger.solidPressed}",
      },
      /**
       * The brand gradient, for the one call to action on a page: Start
       * Playing, Create Game. Use it sparingly; `primary` is the main action
       * everywhere else.
       */
      gradient: {
        // Without relative colour syntax: the ring's end colour, deepened.
        "--btn-bg":
          "color-mix(in oklab, {colors.ring.end} 55%, {colors.black})",
        "--btn-fg": "{colors.white}",
        "--btn-border": "transparent",
        "--btn-edge":
          "color-mix(in oklab, {colors.ring.end} 35%, {colors.black})",
        "--btn-hover":
          "color-mix(in oklab, {colors.ring.end} 50%, {colors.black})",
        "--btn-press":
          "color-mix(in oklab, {colors.ring.end} 45%, {colors.black})",
        "@supports (color: oklch(from red l c h))": {
          "--btn-bg": gradientFill,
          "--btn-edge": `color-mix(in oklab, ${gradientEnd("end")} 55%, {colors.black})`,
          "--btn-hover": `${gradientOverlay("color-mix(in oklab, {colors.white} 8%, transparent)")}, ${gradientFill}`,
          "--btn-press": `${gradientOverlay("color-mix(in oklab, {colors.black} 12%, transparent)")}, ${gradientFill}`,
        },
      },
      /** No border or ledge: toolbar and dialog-close buttons, low emphasis. */
      ghost: {
        "--btn-bg": "transparent",
        "--btn-border": "transparent",
        "--btn-edge": "transparent",
        "--btn-hover": "{colors.overlay.hover}",
        "--btn-press": "{colors.overlay.pressed}",
        boxShadow: "none",
        _hover: { transform: "none", boxShadow: "none" },
        _pressed: {
          transform: "translateY(min(var(--spacing-sink), 1px))",
          boxShadow: "none",
        },
        "&:is(:disabled, [data-disabled]):not([data-busy])": {
          background: "transparent",
          borderColor: "transparent",
          boxShadow: "none",
        },
        "&[data-busy]": { boxShadow: "none" },
      },
      /** Ghost in the accent colour, for text-like actions. */
      text: {
        "--btn-bg": "transparent",
        "--btn-fg": "{colors.accent.fg}",
        "--btn-border": "transparent",
        "--btn-edge": "transparent",
        "--btn-hover": "{colors.overlay.hover}",
        "--btn-press": "{colors.overlay.pressed}",
        boxShadow: "none",
        paddingInline: "2",
        _hover: { transform: "none", boxShadow: "none" },
        _pressed: { transform: "none", boxShadow: "none" },
        "&:is(:disabled, [data-disabled]):not([data-busy])": {
          background: "transparent",
          borderColor: "transparent",
          boxShadow: "none",
        },
      },
    },
    size: {
      sm: {
        minHeight: "32px",
        paddingInline: "3",
        _touch: { minHeight: "40px" },
      },
      md: {},
    },
    iconOnly: {
      true: { paddingInline: 0, width: "38px", _touch: { width: "touch" } },
    },
    fullWidth: {
      true: { width: "100%" },
    },
  },
  compoundVariants: [
    {
      size: "sm",
      iconOnly: true,
      css: { width: "32px", _touch: { width: "40px" } },
    },
  ],
  defaultVariants: { variant: "outline", size: "md" },
});
