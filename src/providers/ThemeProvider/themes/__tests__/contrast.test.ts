import type { Palette } from "@mui/material";
import { describe, expect, it } from "vitest";

import { ColorScheme } from "repositories/shared.types";

import { getTheme, themeConfig } from "../themeConfig";

const WHITE = "#ffffff";
const DARK_SURFACE = "#111827"; // grey[900] — the dark-mode paper background
const GREY_700 = "#374151"; // GradientBox inner box, light mode
const GREY_900 = "#111827"; // GradientBox inner box, dark mode

const AA_TEXT = 4.5;

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

  it("brand ring glows against the inner box it wraps", () => {
    const { icon, ring } = themeConfig[scheme].brand;

    // The ring is NOT held to a page-contrast floor. GradientBox draws it behind
    // an opaque dark inner box (grey.700 light / grey.900 dark) and it reads as
    // a glow around that chip -- pale, bright stops are the intent. What would
    // actually break it is a ring whose every stop is close to the inner box,
    // leaving nothing to glow. So: at least one stop must stand off the chip.
    //
    // Pride may fall back to `icon`; its rainbow is authored in oklch() and is
    // skipped by the hex-only helper.
    if (scheme !== ColorScheme.PrideTraditional) {
      expect(ring, `${scheme} must define an explicit brand.ring`).toBeDefined();
    }

    const hexStops = (ring ?? icon).filter((stop) => HEX_COLOR.test(stop));
    if (hexStops.length === 0) return;

    for (const innerBox of [GREY_700, GREY_900]) {
      const best = Math.max(
        ...hexStops.map((stop) => contrastRatio(stop, innerBox)),
      );
      expect(
        best,
        `${scheme} ring has no stop that stands off the inner box ${innerBox}`,
      ).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });
});
