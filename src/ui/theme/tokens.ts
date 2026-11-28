/**
 * Base and semantic tokens for the Iron Link library. Names follow Panda's
 * generated variables, so `bg.surface` is `--colors-bg-surface`.
 *
 * The scheme-dependent values (`scheme.*`, `ring.*`, the gradients)
 * are declared here with the Default scheme. Every other scheme is a Panda
 * theme (`schemeThemes` in `schemes.ts`) that overrides them under
 * `[data-panda-theme=<scheme>]`; `applyUITheme` sets that attribute.
 */
import { grayStepNames, schemes, zincGrays } from "./schemes";
import { iconGradient, ringGradient } from "./schemes";

const defaultScheme = schemes.default;

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
      grayStepNames.map((step) => [step, { value: zincGrays[step] }]),
    ),
    scheme: {
      light: {
        fg: { value: defaultScheme.light.fg },
        solid: { value: defaultScheme.light.solid },
        onSolid: { value: defaultScheme.light.onSolid },
      },
      dark: {
        fg: { value: defaultScheme.dark.fg },
        solid: { value: defaultScheme.dark.solid },
        onSolid: { value: defaultScheme.dark.onSolid },
      },
    },
    ring: {
      start: { value: defaultScheme.ring[0] },
      end: { value: defaultScheme.ring[1] },
    },
    /**
     * Status colours are Tailwind's own steps, as Tailwind publishes them:
     * 700 for text in light mode, 400 in dark, and 50 and 950 for the
     * matching backgrounds.
     */
    emerald: {
      50: { value: "oklch(97.9% 0.021 166.113)" },
      400: { value: "oklch(76.5% 0.177 163.223)" },
      700: { value: "oklch(50.8% 0.118 165.612)" },
      950: { value: "oklch(26.2% 0.051 172.552)" },
    },
    amber: {
      50: { value: "oklch(98.7% 0.022 95.277)" },
      400: { value: "oklch(82.8% 0.189 84.429)" },
      700: { value: "oklch(55.5% 0.163 48.998)" },
      950: { value: "oklch(27.9% 0.077 45.635)" },
    },
    red: {
      50: { value: "oklch(97.1% 0.013 17.38)" },
      400: { value: "oklch(70.4% 0.191 22.216)" },
      700: { value: "oklch(50.5% 0.213 27.518)" },
      950: { value: "oklch(25.8% 0.092 26.042)" },
    },
    sky: {
      50: { value: "oklch(97.7% 0.013 236.62)" },
      400: { value: "oklch(74.6% 0.16 232.661)" },
      700: { value: "oklch(50% 0.134 242.749)" },
      950: { value: "oklch(29.3% 0.066 243.157)" },
    },
    lime: {
      50: { value: "oklch(98.6% 0.031 120.757)" },
      400: { value: "oklch(84.1% 0.238 128.85)" },
      700: { value: "oklch(53.2% 0.157 131.589)" },
      950: { value: "oklch(27.4% 0.072 132.109)" },
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
    // Control heights: compact chips and steppers, small controls, menu and
    // list rows, medium controls (buttons line up with fields), and the
    // touch target.
    control: {
      xs: { value: "28px" },
      sm: { value: "32px" },
      row: { value: "36px" },
      md: { value: "40px" },
    },
    touch: { value: "44px" },
    // Icons: inside small text, inside every control, and in nav items and
    // radio cards. Chip remove icons and illustrations keep their own sizes.
    icon: {
      sm: { value: "14px" },
      md: { value: "18px" },
      lg: { value: "24px" },
    },
    // The measure for reading text, notes and rules.
    prose: { value: "72ch" },
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
    drawer: { value: 1200 },
    dialog: { value: 1300 },
    /**
     * Above drawers and dialogs, so a roll made in one shows its card on
     * top; below popovers, menus and tooltips, which belong to whatever the
     * reader is pointing at. Dialogs and drawers ignore presses in the toast
     * area rather than closing.
     */
    toast: { value: 1350 },
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

/**
 * The accent, derived from the scheme colours. A subtree can wear another
 * scheme through `schemeScopeCss`, which derives these again there.
 */
const accentTokens = {
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
};

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
    accent: accentTokens,
    focusRing: lightDark(v("scheme-light-fg"), v("scheme-dark-fg")),
    success: {
      fg: lightDark(v("emerald-700"), v("emerald-400")),
      soft: lightDark(v("emerald-50"), v("emerald-950")),
    },
    warning: {
      fg: lightDark(v("amber-700"), v("amber-400")),
      soft: lightDark(v("amber-50"), v("amber-950")),
    },
    info: {
      fg: lightDark(v("sky-700"), v("sky-400")),
      soft: lightDark(v("sky-50"), v("sky-950")),
    },
    cursed: {
      fg: lightDark(v("lime-700"), v("lime-400")),
      soft: lightDark(v("lime-50"), v("lime-950")),
    },
    danger: {
      fg: lightDark(v("red-700"), v("red-400")),
      solid: lightDark(v("red-700"), v("red-400")),
      onSolid: lightDark(v("white"), v("gray-950")),
      soft: lightDark(v("red-50"), v("red-950")),
      solidHover: { value: mix(v("danger-solid"), 90, v("danger-on-solid")) },
      solidPressed: { value: mix(v("danger-solid"), 85, "black") },
      edge: { value: mix(v("danger-solid"), 60, "black") },
    },
  },
  shadows: {
    // A hard ledge under the top border, so the well reads as sunk into the
    // surface: 2px and light in light mode, and deeper in dark mode, where a
    // light one would vanish against the dark well.
    field: lightDark(
      `inset 0 2px 0 ${mix(v("gray-950"), 10, "transparent")}`,
      `inset 0 3px 0 ${mix("black", 80, "transparent")}`,
    ),
    ledge: {
      value: `0 var(--border-widths-ledge) 0 ${v("border-edge")}`,
    },
    /**
     * Floating cards (menus, popovers, select lists, toasts): a tight contact
     * shadow and a soft one, no ledge. Give the card a 1px `border.control`
     * border. Shadow depth says how high a surface floats; a ledge says it can
     * be pressed, so floating surfaces (which aren't pressed) don't get one.
     */
    popover: lightDark(
      `0 1px 2px ${mix(v("gray-950"), 10, "transparent")}, 0 4px 10px -2px ${mix(v("gray-950"), 14, "transparent")}, 0 16px 32px -8px ${mix(v("gray-950"), 30, "transparent")}`,
      `0 1px 2px ${mix("black", 50, "transparent")}, 0 4px 10px -2px ${mix("black", 50, "transparent")}, 0 18px 36px -8px ${mix("black", 78, "transparent")}`,
    ),
    /** Dialogs: the highest surface, a deeper shadow and no ledge. */
    dialog: lightDark(
      `0 1px 3px ${mix(v("gray-950"), 12, "transparent")}, 0 8px 16px -6px ${mix(v("gray-950"), 18, "transparent")}, 0 32px 64px -14px ${mix(v("gray-950"), 42, "transparent")}`,
      `0 1px 3px ${mix("black", 55, "transparent")}, 0 8px 16px -6px ${mix("black", 55, "transparent")}, 0 32px 64px -14px ${mix("black", 85, "transparent")}`,
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

const kebab = (name: string) =>
  name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

function accentDeclarations(mode: "base" | "_dark") {
  return Object.fromEntries(
    Object.entries(accentTokens).map(([name, token]) => [
      `--colors-accent-${kebab(name)}`,
      typeof token.value === "string" ? token.value : token.value[mode],
    ]),
  );
}

/**
 * Global rules that let an element wear a colour scheme other than the
 * page's: give it `data-scheme-scope` and the scheme's colours from
 * `schemeScopeStyle` (schemes.ts). The accent tokens are declared on
 * <html>, so without this rule they keep the page's scheme everywhere below
 * it, whatever scheme colours a descendant sets.
 */
export const schemeScopeCss = {
  "[data-scheme-scope]": accentDeclarations("base"),
  "[data-theme=dark] [data-scheme-scope]": accentDeclarations("_dark"),
};
