import { distributeStops, toOklch } from "./color";

/**
 * Iron Link's nine colour schemes, matching `ColorScheme` in
 * repositories/shared.types. Each carries the accent for light mode (the 700
 * stop, AA on white) and dark mode (400 for text, 500 for fills), plus the two
 * brand gradients: `ring` for roll buttons and the current page tab, `icon`
 * for the logo and favicon.
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

const onLight = "#ffffff";
const onDark = "#030712";

export const schemes = {
  default: {
    label: "Default",
    light: { fg: "#be123c", solid: "#be123c", onSolid: onLight },
    dark: { fg: "#fb7185", solid: "#f43f5e", onSolid: onDark },
    ring: ["#e11d48", "#f59e0b"],
    icon: ["#fb7185", "#d08700"],
  },
  cinder: {
    label: "Cinder",
    light: { fg: "#b91c1c", solid: "#b91c1c", onSolid: onLight },
    dark: { fg: "#f87171", solid: "#ef4444", onSolid: onDark },
    ring: ["#fca5a5", "#b91c1c"],
    icon: ["#f87171", "#991b1b"],
  },
  eidolon: {
    label: "Eidolon",
    light: { fg: "#a16207", solid: "#a16207", onSolid: onLight },
    dark: { fg: "#facc15", solid: "#eab308", onSolid: onDark },
    ring: ["#fef08a", "#ca8a04"],
    icon: ["#fde047", "#854d0e"],
  },
  hinterlands: {
    label: "Hinterlands",
    light: { fg: "#047857", solid: "#047857", onSolid: onLight },
    dark: { fg: "#34d399", solid: "#10b981", onSolid: onDark },
    ring: ["#6ee7b7", "#059669"],
    icon: ["#6ee7b7", "#065f46"],
  },
  myriad: {
    label: "Myriad",
    light: { fg: "#1d4ed8", solid: "#1d4ed8", onSolid: onLight },
    dark: { fg: "#60a5fa", solid: "#3b82f6", onSolid: onDark },
    ring: ["#22d3ee", "#2563eb"],
    icon: ["#67e8f9", "#1d4ed8"],
  },
  mystic: {
    label: "Mystic",
    light: { fg: "#7e22ce", solid: "#7e22ce", onSolid: onLight },
    dark: { fg: "#d8b4fe", solid: "#c084fc", onSolid: onDark },
    ring: ["#a78bfa", "#9333ea"],
    icon: ["#a78bfa", "#6b21a8"],
  },
  orchid: {
    label: "Orchid",
    light: { fg: "#be185d", solid: "#be185d", onSolid: onLight },
    dark: { fg: "#f472b6", solid: "#ec4899", onSolid: onDark },
    ring: ["#f472b6", "#db2777"],
    icon: ["#e879f9", "#be185d"],
  },
  gloaming: {
    label: "Gloaming",
    light: { fg: "#7e22ce", solid: "#7e22ce", onSolid: onLight },
    dark: { fg: "#d8b4fe", solid: "#c084fc", onSolid: onDark },
    ring: ["#f472b6", "#a855f7", "#60a5fa"],
    icon: ["#ec4899", "#9333ea", "#3b82f6"],
  },
  pride_traditional: {
    label: "Pride",
    light: { fg: "#1d4ed8", solid: "#1d4ed8", onSolid: onLight },
    dark: { fg: "#60a5fa", solid: "#3b82f6", onSolid: onDark },
    ring: prideStops,
    icon: prideStops,
    linearRing: true,
  },
} satisfies Record<string, SchemeDefinition>;

export type SchemeName = keyof typeof schemes;
export const schemeNames = Object.keys(schemes) as SchemeName[];

/** Tailwind's Zinc: the one neutral ramp every scheme shares. */
const zinc = [
  "#fafafa",
  "#f4f4f5",
  "#e4e4e7",
  "#d4d4d8",
  "#a1a1aa",
  "#71717a",
  "#52525b",
  "#3f3f46",
  "#27272a",
  "#18181b",
  "#09090b",
];
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
 * The neutral ramp, Zinc in OKLCH. Schemes don't tint it: their colour is in
 * the accent, ring and icon tokens alone.
 */
export const zincGrays = Object.fromEntries(
  zinc.map((hex, index) => [grayStepNames[index], toOklch(hex)]),
) as Record<(typeof grayStepNames)[number], string>;

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
          fg: { value: toOklch(scheme.light.fg) },
          solid: { value: toOklch(scheme.light.solid) },
          onSolid: { value: toOklch(scheme.light.onSolid) },
        },
        dark: {
          fg: { value: toOklch(scheme.dark.fg) },
          solid: { value: toOklch(scheme.dark.solid) },
          onSolid: { value: toOklch(scheme.dark.onSolid) },
        },
      },
      ring: {
        start: { value: toOklch(scheme.ring[0]) },
        end: { value: toOklch(scheme.ring[scheme.ring.length - 1]) },
      },
    },
    gradients: {
      ring: { value: ringGradient(scheme) },
      icon: { value: iconGradient(scheme) },
    },
  };
}

export const schemeThemes = Object.fromEntries(
  schemeNames
    .filter((name) => name !== "default")
    .map((name) => [name, { tokens: schemeTokens(schemes[name]) }]),
);
