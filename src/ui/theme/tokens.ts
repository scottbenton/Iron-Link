/**
 * Base and semantic tokens for the Iron Link library. Names follow Panda's
 * generated variables, so `bg.surface` is `--colors-bg-surface`.
 *
 * The scheme-dependent values (`gray.*`, `scheme.*`, `ring.*`, the gradients)
 * are declared here with the Default scheme. Every other scheme is a Panda
 * theme (`schemeThemes` in `schemes.ts`) that overrides them under
 * `[data-panda-theme=<scheme>]`; `applyUITheme` sets that attribute.
 */
import { toOklch } from "./color";
import { grayStepNames, schemes, tintedGrays } from "./schemes";
import { iconGradient, ringGradient } from "./schemes";

const defaultScheme = schemes.default;
const defaultGrays = tintedGrays(defaultScheme);

const mix = (a: string, percent: number, b: string) =>
  `color-mix(in oklab, ${a} ${percent}%, ${b})`;
const v = (name: string) => `var(--colors-${name})`;

export const tokens = {
  colors: {
    white: { value: "#ffffff" },
    black: { value: "#000000" },
    transparent: { value: "transparent" },
    current: { value: "currentColor" },
    gray: Object.fromEntries(
      grayStepNames.map((step) => [step, { value: defaultGrays[step] }]),
    ),
    scheme: {
      light: {
        fg: { value: toOklch(defaultScheme.light.fg) },
        solid: { value: toOklch(defaultScheme.light.solid) },
        onSolid: { value: toOklch(defaultScheme.light.onSolid) },
      },
      dark: {
        fg: { value: toOklch(defaultScheme.dark.fg) },
        solid: { value: toOklch(defaultScheme.dark.solid) },
        onSolid: { value: toOklch(defaultScheme.dark.onSolid) },
      },
    },
    ring: {
      start: { value: toOklch(defaultScheme.ring[0]) },
      end: { value: toOklch(defaultScheme.ring[1]) },
    },
    status: {
      success: {
        light: { value: toOklch("#007a55") },
        dark: { value: toOklch("#00d492") },
      },
      warning: {
        light: { value: toOklch("#bb4d00") },
        dark: { value: toOklch("#ffb900") },
      },
      danger: {
        light: { value: toOklch("#c10007") },
        dark: { value: toOklch("#ff6467") },
      },
      info: {
        light: { value: toOklch("#00699d") },
        dark: { value: toOklch("#00bcff") },
      },
      cursed: {
        light: { value: toOklch("#497d00") },
        dark: { value: toOklch("#9ae600") },
      },
    },
  },
  gradients: {
    ring: { value: ringGradient(defaultScheme) },
    icon: { value: iconGradient(defaultScheme) },
  },
  radii: {
    xs: { value: "4px" },
    sm: { value: "6px" },
    md: { value: "8px" },
    lg: { value: "12px" },
    xl: { value: "16px" },
    full: { value: "9999px" },
  },
  spacing: {
    0: { value: "0px" },
    0.5: { value: "2px" },
    1: { value: "4px" },
    1.5: { value: "6px" },
    2: { value: "8px" },
    3: { value: "12px" },
    4: { value: "16px" },
    5: { value: "20px" },
    6: { value: "24px" },
    8: { value: "32px" },
    10: { value: "40px" },
    12: { value: "48px" },
    16: { value: "64px" },
  },
  sizes: {
    touch: { value: "44px" },
    full: { value: "100%" },
    min: { value: "min-content" },
    max: { value: "max-content" },
    fit: { value: "fit-content" },
  },
  fonts: {
    body: {
      value:
        '"Allo", "Inter Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    },
    heading: {
      value:
        '"Sofia Sans Condensed Variable", "Barlow Condensed", "Arial Narrow", -apple-system, BlinkMacSystemFont, sans-serif',
    },
    mono: {
      value: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    },
  },
  fontSizes: {
    "2xs": { value: "0.6875rem" },
    xs: { value: "0.75rem" },
    sm: { value: "0.875rem" },
    md: { value: "1rem" },
    lg: { value: "1.25rem" },
    xl: { value: "1.5rem" },
    "2xl": { value: "2rem" },
    "3xl": { value: "2.75rem" },
  },
  fontWeights: {
    normal: { value: "400" },
    medium: { value: "500" },
    semibold: { value: "600" },
    bold: { value: "700" },
  },
  lineHeights: {
    none: { value: "1" },
    tight: { value: "1.15" },
    snug: { value: "1.3" },
    normal: { value: "1.5" },
    relaxed: { value: "1.65" },
  },
  letterSpacings: {
    normal: { value: "0" },
    label: { value: "0.06em" },
    wide: { value: "0.1em" },
  },
  durations: {
    instant: { value: "80ms" },
    fast: { value: "140ms" },
    normal: { value: "200ms" },
    slow: { value: "280ms" },
    ringSpin: { value: "5s" },
  },
  easings: {
    out: { value: "cubic-bezier(0.23, 1, 0.32, 1)" },
    inOut: { value: "cubic-bezier(0.77, 0, 0.175, 1)" },
    in: { value: "cubic-bezier(0.4, 0, 1, 1)" },
  },
  borderWidths: {
    hairline: { value: "1px" },
    ledge: { value: "2px" },
  },
  zIndex: {
    sticky: { value: 100 },
    /**
     * Below drawers and dialogs: a modal hides the toasts, as in the app
     * today, so pressing a toast never counts as a press outside the modal.
     * A dialog shows recent roll cards through its own `extras` instead.
     */
    toast: { value: 1100 },
    drawer: { value: 1200 },
    dialog: { value: 1300 },
    popover: { value: 1400 },
    tooltip: { value: 1600 },
  },
};

/**
 * Light and dark values. `_dark` is our own condition (see panda.config.ts),
 * which matches `[data-theme=dark]`. The app always writes `data-theme`
 * (through `applyUITheme`), resolving "system" itself.
 */
const lightDark = (light: string, dark: string) => ({
  value: { base: light, _dark: dark },
});

export const semanticTokens = {
  colors: {
    bg: {
      canvas: lightDark(v("gray-100"), v("gray-950")),
      surface: lightDark(v("white"), v("gray-900")),
      muted: lightDark(v("gray-50"), mix(v("gray-900"), 60, v("gray-800"))),
      emphasized: lightDark(v("gray-200"), v("gray-800")),
      strip: lightDark(v("gray-300"), v("gray-700")),
      chip: lightDark(v("gray-700"), v("gray-900")),
      chipPressed: { value: mix(v("bg-chip"), 85, "white") },
      stat: lightDark(v("gray-700"), v("gray-800")),
      statPressed: { value: mix(v("bg-stat"), 85, "white") },
      field: lightDark(
        mix(v("gray-100"), 40, v("white")),
        mix(v("gray-950"), 55, v("gray-900")),
      ),
    },
    fg: {
      default: lightDark(v("gray-800"), v("gray-50")),
      muted: lightDark(v("gray-600"), v("gray-300")),
      subtle: lightDark(v("gray-500"), v("gray-400")),
      disabled: lightDark(v("gray-400"), v("gray-600")),
      onChip: { value: v("white") },
    },
    border: {
      subtle: lightDark(v("gray-200"), v("gray-800")),
      default: lightDark(v("gray-300"), v("gray-700")),
      control: lightDark(mix(v("gray-400"), 45, v("gray-500")), v("gray-500")),
      edge: lightDark(v("gray-300"), v("gray-700")),
      stat: { value: v("gray-950") },
    },
    overlay: {
      hover: lightDark(
        mix(v("gray-950"), 5, "transparent"),
        mix(v("gray-100"), 8, "transparent"),
      ),
      pressed: lightDark(
        mix(v("gray-950"), 10, "transparent"),
        mix(v("gray-100"), 14, "transparent"),
      ),
      selected: lightDark(
        mix(v("gray-950"), 8, "transparent"),
        mix(v("gray-100"), 11, "transparent"),
      ),
    },
    backdrop: lightDark(
      mix(v("gray-950"), 45, "transparent"),
      mix("black", 60, "transparent"),
    ),
    accent: {
      fg: lightDark(v("scheme-light-fg"), v("scheme-dark-fg")),
      solid: lightDark(v("scheme-light-solid"), v("scheme-dark-solid")),
      onSolid: lightDark(v("scheme-light-on-solid"), v("scheme-dark-on-solid")),
      soft: lightDark(
        mix(v("scheme-light-fg"), 6, v("bg-surface")),
        mix(v("scheme-dark-fg"), 14, v("bg-surface")),
      ),
      edge: lightDark(
        mix(v("scheme-light-solid"), 62, "black"),
        mix(v("scheme-dark-solid"), 55, "black"),
      ),
      solidHover: { value: mix(v("accent-solid"), 90, v("accent-on-solid")) },
      solidPressed: { value: mix(v("accent-solid"), 85, "black") },
    },
    focusRing: lightDark(v("scheme-light-fg"), v("scheme-dark-fg")),
    ringEdge: { value: mix(v("ring-end"), 50, "black") },
    success: {
      fg: lightDark(v("status-success-light"), v("status-success-dark")),
      soft: lightDark(
        mix(v("status-success-light"), 8, v("bg-surface")),
        mix(v("status-success-dark"), 14, v("bg-surface")),
      ),
    },
    warning: {
      fg: lightDark(v("status-warning-light"), v("status-warning-dark")),
      soft: lightDark(
        mix(v("status-warning-light"), 8, v("bg-surface")),
        mix(v("status-warning-dark"), 14, v("bg-surface")),
      ),
    },
    info: {
      fg: lightDark(v("status-info-light"), v("status-info-dark")),
      soft: lightDark(
        mix(v("status-info-light"), 8, v("bg-surface")),
        mix(v("status-info-dark"), 14, v("bg-surface")),
      ),
    },
    cursed: {
      fg: lightDark(v("status-cursed-light"), v("status-cursed-dark")),
      soft: lightDark(
        mix(v("status-cursed-light"), 8, v("bg-surface")),
        mix(v("status-cursed-dark"), 14, v("bg-surface")),
      ),
    },
    danger: {
      fg: lightDark(v("status-danger-light"), v("status-danger-dark")),
      solid: lightDark(v("status-danger-light"), v("status-danger-dark")),
      onSolid: lightDark(v("white"), v("gray-950")),
      soft: lightDark(
        mix(v("status-danger-light"), 8, v("bg-surface")),
        mix(v("status-danger-dark"), 14, v("bg-surface")),
      ),
      solidHover: { value: mix(v("danger-solid"), 90, v("danger-on-solid")) },
      solidPressed: { value: mix(v("danger-solid"), 85, "black") },
      edge: { value: mix(v("danger-solid"), 60, "black") },
    },
  },
  shadows: {
    field: lightDark(
      `inset 0 1.5px 0 ${mix(v("gray-950"), 7, "transparent")}`,
      `inset 0 1.5px 0 ${mix("black", 45, "transparent")}`,
    ),
    ledge: {
      value: `0 var(--border-widths-ledge) 0 ${v("border-edge")}`,
    },
    /**
     * Floating cards (menus, popovers, select lists, toasts): a 3px ledge, a
     * tight contact shadow and a soft one. Give the card a 1px
     * `border.control` border. Shadow depth says how high a surface floats;
     * the ledge is what says it can be touched.
     */
    popover: lightDark(
      `0 3px 0 ${v("border-edge")}, 0 4px 8px -4px ${mix(v("gray-950"), 14, "transparent")}, 0 14px 28px -10px ${mix(v("gray-950"), 32, "transparent")}`,
      `0 3px 0 ${v("border-edge")}, 0 4px 8px -4px ${mix("black", 50, "transparent")}, 0 16px 32px -10px ${mix("black", 78, "transparent")}`,
    ),
    /** Dialogs: the highest surface, a 4px ledge and a deeper shadow. */
    dialog: lightDark(
      `0 4px 0 ${v("border-edge")}, 0 6px 12px -6px ${mix(v("gray-950"), 18, "transparent")}, 0 28px 56px -14px ${mix(v("gray-950"), 42, "transparent")}`,
      `0 4px 0 ${v("border-edge")}, 0 6px 12px -6px ${mix("black", 55, "transparent")}, 0 28px 56px -14px ${mix("black", 85, "transparent")}`,
    ),
    /**
     * Things fixed to an edge of the screen (side drawers, sheets) have no
     * bottom edge to stand on, so they keep only the dialog's soft shadow.
     */
    float: lightDark(
      `0 28px 56px -14px ${mix(v("gray-950"), 42, "transparent")}`,
      `0 28px 56px -14px ${mix("black", 85, "transparent")}`,
    ),
  },
  spacing: {
    /** Travel on hover. Zero unless the page opts in with [data-lift=on]. */
    lift: { value: "0px" },
    /** Travel on press. Zero under reduced motion. */
    sink: { value: "1px" },
  },
};
