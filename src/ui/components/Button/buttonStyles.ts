import { cva } from "styled-system/css";

/** The selector for a disabled button that is not busy. */
const disabled = "&:is(:disabled, [data-disabled]):not([data-busy])";

/**
 * The gradient button's parts: the ring (a spinning `GradientBox` filling
 * the button) and the dark face inside it. Their rules are keyed on data
 * attributes as well as their class, so they never race the GradientBox's
 * own styles in the stylesheet.
 */
export const gradientRingStyles = "ui-button-gradient-ring";
export const gradientFaceStyles = "ui-button-gradient-face";

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
    // The label's inline padding, which the gradient variant moves inside
    // its ring.
    "--btn-pad": "token(spacing.4)",
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
       * The brand call to action, as on the app's main flows (Start Playing,
       * Create Game): white text on a dark face inside a spinning ring of the
       * scheme's gradient, which thickens on hover, focus and press. Use it
       * once on a page; `primary` is the main action everywhere else.
       */
      gradient: {
        "--btn-fg": "{colors.white}",
        "--btn-border": "transparent",
        // No box-shadow ledge and no button background: both were one fixed
        // colour (the ring's end colour, darkened), which went brown against
        // the turning ring and showed as a dark fringe around its rounded
        // corners. The ring itself reaches below the button instead, and a
        // shade over that strip makes the ledge, so the ledge is always the
        // colour of the ring above it.
        "--btn-bg": "transparent",
        "--btn-hover": "transparent",
        "--btn-press": "transparent",
        "--btn-edge": "transparent",
        "--btn-ledge": "var(--border-widths-ledge)",
        // How much the ledge darkens the ring. Light mode keeps it light:
        // black over a bright ring there reads as mud.
        "--btn-ledge-shade": "rgb(0 0 0 / 0.18)",
        _dark: { "--btn-ledge-shade": "rgb(0 0 0 / 0.32)" },
        // The ring's width and the face's colour, read by the parts inside.
        "--btn-ring": "2px",
        "--btn-face": "{colors.gray.900}",
        alignItems: "stretch",
        borderWidth: 0,
        boxShadow: "none",
        _hover: {
          "--btn-ring": "3px",
          "--btn-ledge":
            "calc(var(--border-widths-ledge) - var(--spacing-lift))",
          "--btn-face":
            "color-mix(in oklab, {colors.gray.900} 82%, {colors.gray.700})",
          boxShadow: "none",
        },
        _focusVisible: { "--btn-ring": "3px" },
        _pressed: {
          "--btn-ring": "3px",
          "--btn-ledge":
            "max(0px, calc(var(--border-widths-ledge) - var(--spacing-sink)))",
          "--btn-face":
            "color-mix(in oklab, {colors.gray.900} 60%, {colors.black})",
          boxShadow: "none",
        },
        [disabled]: {
          "--btn-fg": "{colors.fg.subtle}",
          "--btn-ring": "2px",
          "--btn-face": "{colors.bg.emphasized}",
          background: "transparent",
          borderColor: "transparent",
          boxShadow: "none",
        },
        "&[data-busy]": { background: "transparent", boxShadow: "none" },
        [`& .${gradientRingStyles}[data-gradient-ring]`]: {
          display: "flex",
          flex: "1 1 auto",
          minWidth: 0,
          padding: "var(--btn-ring)",
          // The ring hangs below the button by the ledge's height, as the
          // box-shadow ledge on other buttons does, without changing the
          // button's own size.
          paddingBottom: "calc(var(--btn-ring) + var(--btn-ledge))",
          marginBottom: "calc(-1 * var(--btn-ledge))",
          transitionProperty: "padding, margin",
          transitionDuration: "fast",
          transitionTimingFunction: "out",
          _reducedMotion: { transitionDuration: "0s" },
          // The shade over the ring's bottom strip: the ledge. Above the
          // turning gradient (z-index -2) and under the face.
          "&::after": {
            content: '""',
            position: "absolute",
            zIndex: -1,
            insetInline: 0,
            bottom: 0,
            height: "var(--btn-ledge)",
            background: "var(--btn-ledge-shade)",
            pointerEvents: "none",
          },
        },
        // Disabled: the ring goes flat grey and stops turning.
        [`&:is(:disabled, [data-disabled]):not([data-busy]) .${gradientRingStyles}[data-gradient-ring]`]:
          {
            "--gradient-box-fill":
              "linear-gradient({colors.border.default}, {colors.border.default})",
            "&::before": { animationPlayState: "paused" },
          },
        [`& .${gradientFaceStyles}[data-gradient-face]`]: {
          boxSizing: "border-box",
          display: "inline-flex",
          flex: "1 1 auto",
          alignItems: "center",
          justifyContent: "center",
          gap: "2",
          minWidth: 0,
          paddingInline: "max(0px, calc(var(--btn-pad) - var(--btn-ring)))",
          borderRadius: "max(0px, calc(token(radii.md) - var(--btn-ring)))",
          background: "var(--btn-face)",
          color: "var(--btn-fg)",
          textShadow: "none",
          transitionProperty: "padding, border-radius, background-color",
          transitionDuration: "fast",
          transitionTimingFunction: "out",
          _reducedMotion: { transitionProperty: "background-color" },
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
        "--btn-pad": "token(spacing.3)",
        minHeight: "32px",
        paddingInline: "3",
        _touch: { minHeight: "40px" },
      },
      md: {},
    },
    iconOnly: {
      true: {
        "--btn-pad": "0px",
        paddingInline: 0,
        width: "38px",
        _touch: { width: "touch" },
      },
    },
    fullWidth: {
      true: { width: "100%" },
    },
  },
  compoundVariants: [
    {
      // The ring fills the button; the label's padding is inside the face.
      variant: "gradient",
      css: { paddingInline: 0 },
    },
    {
      size: "sm",
      iconOnly: true,
      css: { width: "32px", _touch: { width: "40px" } },
    },
  ],
  defaultVariants: { variant: "outline", size: "md" },
});
