import type { CSSProperties } from "react";

/**
 * Iron Link's nine colour schemes, matching `ColorScheme` in
 * repositories/shared.types. Each carries the accent for light mode (the 700
 * stop, AA on white) and dark mode (400 for text, 500 for fills), plus the two
 * brand gradients: `ring` for roll buttons and the current page tab, `icon`
 * for the logo and favicon. Colours are OKLCH, converted once from the
 * app's hex values.
 */
export interface SchemeDefinition {
  label: string;
  light: { fg: string; solid: string; onSolid: string };
  dark: { fg: string; solid: string; onSolid: string };
  ring: string[];
  icon: string[];
  /** Pride uses a straight rainbow rather than the radial glow. */
  linearRing?: boolean;
}

const prideStops = [
  "oklch(63.7% 0.237 25.331)",
  "oklch(70.5% 0.213 47.604)",
  "oklch(79.5% 0.184 86.047)",
  "oklch(69.6% 0.17 162.48)",
  "oklch(62.3% 0.214 259.815)",
  "oklch(60.6% 0.25 292.717)",
];

const onLight = "oklch(100% 0 0)";
const onDark = "oklch(12.96% 0.0274 261.69)";

export const schemes = {
  default: {
    label: "Sunrise",
    light: {
      fg: "oklch(51.43% 0.1978 16.93)",
      solid: "oklch(51.43% 0.1978 16.93)",
      onSolid: onLight,
    },
    dark: {
      fg: "oklch(71.92% 0.169 13.43)",
      solid: "oklch(64.5% 0.2154 16.44)",
      onSolid: onDark,
    },
    ring: ["oklch(58.58% 0.222 17.58)", "oklch(76.86% 0.1647 70.08)"],
    icon: ["oklch(71.92% 0.169 13.43)", "oklch(68.22% 0.1465 71.47)"],
  },
  cinder: {
    label: "Cinder",
    light: {
      fg: "oklch(50.54% 0.1905 27.52)",
      solid: "oklch(50.54% 0.1905 27.52)",
      onSolid: onLight,
    },
    dark: {
      fg: "oklch(71.06% 0.1661 22.22)",
      solid: "oklch(63.68% 0.2078 25.33)",
      onSolid: onDark,
    },
    ring: ["oklch(80.77% 0.1035 19.57)", "oklch(50.54% 0.1905 27.52)"],
    icon: ["oklch(71.06% 0.1661 22.22)", "oklch(44.37% 0.1613 26.9)"],
  },
  eidolon: {
    label: "Eidolon",
    light: {
      fg: "oklch(55.38% 0.1207 66.44)",
      solid: "oklch(55.38% 0.1207 66.44)",
      onSolid: onLight,
    },
    dark: {
      fg: "oklch(86.06% 0.1731 91.94)",
      solid: "oklch(79.52% 0.1617 86.05)",
      onSolid: onDark,
    },
    ring: ["oklch(94.51% 0.1243 101.54)", "oklch(68.06% 0.1423 75.83)"],
    icon: ["oklch(90.52% 0.1657 98.11)", "oklch(47.62% 0.1034 61.91)"],
  },
  hinterlands: {
    label: "Hinterlands",
    light: {
      fg: "oklch(50.81% 0.1049 165.61)",
      solid: "oklch(50.81% 0.1049 165.61)",
      onSolid: onLight,
    },
    dark: {
      fg: "oklch(77.29% 0.1535 163.22)",
      solid: "oklch(69.59% 0.1491 162.48)",
      onSolid: onDark,
    },
    ring: ["oklch(84.52% 0.1299 164.98)", "oklch(59.6% 0.1274 163.23)"],
    icon: ["oklch(84.52% 0.1299 164.98)", "oklch(43.18% 0.0865 166.91)"],
  },
  myriad: {
    label: "Myriad",
    light: {
      fg: "oklch(48.82% 0.2172 264.38)",
      solid: "oklch(48.82% 0.2172 264.38)",
      onSolid: onLight,
    },
    dark: {
      fg: "oklch(71.37% 0.1434 254.62)",
      solid: "oklch(62.31% 0.188 259.81)",
      onSolid: onDark,
    },
    ring: ["oklch(79.71% 0.1339 211.53)", "oklch(54.61% 0.2152 262.88)"],
    icon: ["oklch(86.51% 0.1153 207.08)", "oklch(48.82% 0.2172 264.38)"],
  },
  mystic: {
    label: "Mystic",
    light: {
      fg: "oklch(49.55% 0.2369 301.92)",
      solid: "oklch(49.55% 0.2369 301.92)",
      onSolid: onLight,
    },
    dark: {
      fg: "oklch(82.68% 0.1082 306.38)",
      solid: "oklch(72.17% 0.1767 305.5)",
      onSolid: onDark,
    },
    ring: ["oklch(70.9% 0.1592 293.54)", "oklch(55.75% 0.2525 302.32)"],
    icon: ["oklch(70.9% 0.1592 293.54)", "oklch(43.83% 0.1983 303.72)"],
  },
  orchid: {
    label: "Orchid",
    light: {
      fg: "oklch(52.46% 0.199 3.96)",
      solid: "oklch(52.46% 0.199 3.96)",
      onSolid: onLight,
    },
    dark: {
      fg: "oklch(72.53% 0.1752 349.76)",
      solid: "oklch(65.59% 0.2118 354.31)",
      onSolid: onDark,
    },
    ring: ["oklch(72.53% 0.1752 349.76)", "oklch(59.16% 0.218 0.58)"],
    icon: ["oklch(74.77% 0.207 322.16)", "oklch(52.46% 0.199 3.96)"],
  },
  gloaming: {
    label: "Gloaming",
    light: {
      fg: "oklch(49.55% 0.2369 301.92)",
      solid: "oklch(49.55% 0.2369 301.92)",
      onSolid: onLight,
    },
    dark: {
      fg: "oklch(82.68% 0.1082 306.38)",
      solid: "oklch(72.17% 0.1767 305.5)",
      onSolid: onDark,
    },
    ring: [
      "oklch(72.53% 0.1752 349.76)",
      "oklch(62.68% 0.2325 303.9)",
      "oklch(71.37% 0.1434 254.62)",
    ],
    icon: [
      "oklch(65.59% 0.2118 354.31)",
      "oklch(55.75% 0.2525 302.32)",
      "oklch(62.31% 0.188 259.81)",
    ],
  },
  pride_traditional: {
    label: "Pride",
    light: {
      fg: "oklch(48.82% 0.2172 264.38)",
      solid: "oklch(48.82% 0.2172 264.38)",
      onSolid: onLight,
    },
    dark: {
      fg: "oklch(71.37% 0.1434 254.62)",
      solid: "oklch(62.31% 0.188 259.81)",
      onSolid: onDark,
    },
    ring: prideStops,
    icon: prideStops,
    linearRing: true,
  },
} satisfies Record<string, SchemeDefinition>;

export type SchemeName = keyof typeof schemes;
export const schemeNames = Object.keys(schemes) as SchemeName[];

export const grayStepNames = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;

/**
 * The neutral ramp: Tailwind's Zinc, as Tailwind publishes it. Schemes don't
 * tint it: their colour is in the accent, ring and icon tokens alone.
 */
export const zincGrays: Record<(typeof grayStepNames)[number], string> = {
  "50": "oklch(98.5% 0 0)",
  "100": "oklch(96.7% 0.001 286.375)",
  "200": "oklch(92% 0.004 286.32)",
  "300": "oklch(87.1% 0.006 286.286)",
  "400": "oklch(70.5% 0.015 286.067)",
  "500": "oklch(55.2% 0.016 285.938)",
  "600": "oklch(44.2% 0.017 285.786)",
  "700": "oklch(37% 0.013 285.805)",
  "800": "oklch(27.4% 0.006 286.033)",
  "900": "oklch(21% 0.006 285.885)",
  "950": "oklch(14.1% 0.005 285.823)",
};

const round = (value: number, places: number) =>
  Math.round(value * 10 ** places) / 10 ** places;

/** Spreads colour stops evenly across [start, end] percent, as Iron Link does today. */
function distributeStops(colors: string[], start: number, end: number) {
  return colors
    .map((color, index) => {
      const position =
        colors.length === 1
          ? start
          : start + ((end - start) * index) / (colors.length - 1);
      return `${color} ${round(position, 2)}%`;
    })
    .join(", ");
}

export function ringGradient(scheme: SchemeDefinition) {
  return scheme.linearRing
    ? `linear-gradient(90deg, ${distributeStops(scheme.ring, 0, 83.33)})`
    : `radial-gradient(142% 91% at 111% 84%, ${distributeStops(scheme.ring, 20, 80)})`;
}

export function iconGradient(scheme: SchemeDefinition) {
  return `linear-gradient(150deg, ${distributeStops(scheme.icon, 0, 100)})`;
}

/** The same values as Panda theme tokens, for `themes` in panda.config.ts. */
export function schemeTokens(scheme: SchemeDefinition) {
  return {
    colors: {
      scheme: {
        light: {
          fg: { value: scheme.light.fg },
          solid: { value: scheme.light.solid },
          onSolid: { value: scheme.light.onSolid },
        },
        dark: {
          fg: { value: scheme.dark.fg },
          solid: { value: scheme.dark.solid },
          onSolid: { value: scheme.dark.onSolid },
        },
      },
      ring: {
        start: { value: scheme.ring[0] },
        end: { value: scheme.ring[scheme.ring.length - 1] },
      },
    },
    gradients: {
      ring: { value: ringGradient(scheme) },
      icon: { value: iconGradient(scheme) },
    },
  };
}

/**
 * A scheme's colours as inline custom properties, for an element marked
 * `data-scheme-scope` (see `schemeScopeCss` in tokens.ts): its accent then
 * follows this scheme, whatever the page wears.
 */
export function schemeScopeStyle(scheme: SchemeDefinition) {
  return {
    "--colors-scheme-light-fg": scheme.light.fg,
    "--colors-scheme-light-solid": scheme.light.solid,
    "--colors-scheme-light-on-solid": scheme.light.onSolid,
    "--colors-scheme-dark-fg": scheme.dark.fg,
    "--colors-scheme-dark-solid": scheme.dark.solid,
    "--colors-scheme-dark-on-solid": scheme.dark.onSolid,
  } as CSSProperties;
}

export const schemeThemes = Object.fromEntries(
  schemeNames
    .filter((name) => name !== "default")
    .map((name) => [name, { tokens: schemeTokens(schemes[name]) }]),
);
