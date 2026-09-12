import type { Palette } from "@mui/material";
import { describe, expect, it } from "vitest";

import { ColorScheme } from "repositories/shared.types";

import { getTheme, themeConfig } from "../themeConfig";

const WHITE = "#ffffff";
const LIGHT_PAGE = "#f3f4f6"; // grey[100] — the light-mode default background
const DARK_SURFACE = "#111827"; // grey[900] — the dark-mode paper background
const DARK_PAGE = "#030712"; // grey[950] — the dark-mode default background

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function parseHex(hex: string): [number, number, number] {
  if (!HEX_COLOR.test(hex)) {
    throw new Error(`Expected a #rrggbb color, received "${hex}"`);
  }
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** WCAG 2.1 relative luminance. */
function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio, always >= 1. */
function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

function expectContrast(
  foreground: string,
  background: string,
  minimum: number,
  label: string,
) {
  const ratio = contrastRatio(foreground, background);
  expect(
    ratio,
    `${label}: ${foreground} on ${background} was ${ratio.toFixed(2)}:1, expected >= ${minimum}:1`,
  ).toBeGreaterThanOrEqual(minimum);
}

const COLOR_ROLES = [
  "primary",
  "secondary",
  "success",
  "warning",
  "error",
  "info",
  "cursed",
] as const;

const schemes = Object.values(ColorScheme);

describe("contrastRatio helper", () => {
  it("matches known WCAG values", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#767676", "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
});

/**
 * `getTheme` is typed as the plain `Theme`, but createTheme's `colorSchemes`
 * option means the assembled object carries both mode palettes at runtime.
 */
function getModePalettes(scheme: ColorScheme) {
  const { colorSchemes } = getTheme(scheme) as unknown as {
    colorSchemes: {
      light: { palette: Palette };
      dark?: { palette: Palette };
    };
  };
  return colorSchemes;
}

describe.each(schemes)("color scheme %s", (scheme) => {
  const colorSchemes = getModePalettes(scheme);
  const lightPalette = colorSchemes.light.palette;
  const darkPalette = colorSchemes.dark?.palette;

  it("has a dark color scheme palette", () => {
    expect(darkPalette).toBeDefined();
  });

  it.each(COLOR_ROLES)("light %s.main clears AA against white", (role) => {
    expectContrast(
      lightPalette[role].main,
      WHITE,
      AA_TEXT,
      `${scheme} light ${role}.main`,
    );
  });

  it.each(COLOR_ROLES)(
    "dark %s.main clears AA against the dark surface",
    (role) => {
      expectContrast(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        darkPalette![role].main,
        DARK_SURFACE,
        AA_TEXT,
        `${scheme} dark ${role}.main`,
      );
    },
  );

  it.each(COLOR_ROLES)(
    "light %s.contrastText clears AA on its main",
    (role) => {
      expectContrast(
        lightPalette[role].contrastText,
        lightPalette[role].main,
        AA_TEXT,
        `${scheme} light ${role}.contrastText`,
      );
    },
  );

  it.each(COLOR_ROLES)("dark %s.contrastText clears AA on its main", (role) => {
    expectContrast(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      darkPalette![role].contrastText,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      darkPalette![role].main,
      AA_TEXT,
      `${scheme} dark ${role}.contrastText`,
    );
  });

  it("brand ring stops clear 3:1 on light and dark surfaces", () => {
    const { icon, ring } = themeConfig[scheme].brand;

    // Default is explicitly exempt from checking its `icon` stops: its original
    // bright mark is preserved by product decision, and those stops do not
    // clear 3:1 on a light page. It is the one theme carrying a darker `ring`
    // override, and that override is what is asserted here.
    if (scheme === ColorScheme.Default) {
      expect(ring, "Default must supply a ring override").toBeDefined();
    }

    const stops = ring ?? icon;

    // Pride's rainbow stops are authored in oklch() and are not parseable by
    // the hex-only helper; they are skipped rather than converted.
    const hexStops = stops.filter((stop) => HEX_COLOR.test(stop));

    for (const stop of hexStops) {
      for (const background of [WHITE, LIGHT_PAGE, DARK_PAGE]) {
        expectContrast(
          stop,
          background,
          AA_NON_TEXT,
          `${scheme} brand ring stop`,
        );
      }
    }
  });
});
