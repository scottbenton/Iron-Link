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
