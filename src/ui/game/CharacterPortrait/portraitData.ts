import { SchemeName, iconGradient, schemes } from "ui/theme";

export type PortraitSize = "xs" | "sm" | "md" | "lg" | "xl";

/** Diameters in pixels. md is a 44px touch target. */
export const portraitSizes: Record<PortraitSize, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 60,
  xl: 88,
};

/** "Kira Vale" → "KV"; one letter where the portrait is small. */
export function getInitials(name: string, letters: 1 | 2 = 2): string {
  const words = name
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  const first = Array.from(words[0])[0] ?? "";
  if (letters === 1 || words.length === 1) return first.toUpperCase();
  const last = Array.from(words[words.length - 1])[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

/** A stable hue from a name, for characters without a scheme or seed. */
export function hashHue(text: string): number {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % 360;
}

/**
 * The background behind initials: the scheme's icon gradient when the
 * character has a colour scheme, else a two-stop gradient around a hue.
 */
export function getPortraitGradient(options: {
  name: string;
  colorScheme?: SchemeName;
  colorSeed?: number;
}): string {
  const { name, colorScheme, colorSeed } = options;
  if (colorScheme && colorScheme in schemes) {
    return iconGradient(schemes[colorScheme]);
  }
  const hue = colorSeed ?? hashHue(name);
  return `linear-gradient(150deg, oklch(72% 0.13 ${hue}), oklch(46% 0.14 ${(hue + 35) % 360}))`;
}
