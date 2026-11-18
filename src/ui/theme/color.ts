/**
 * Colour helpers for building tokens at config time. Panda runs the config in
 * Node, so the neutral ramp and the scheme gradients are computed here
 * rather than shipped as runtime code.
 */

function srgbToLinear(c: number) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Converts #rrggbb to [lightness 0..1, chroma, hue degrees] in OKLCH. */
export function hexToOklch(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = srgbToLinear(((n >> 16) & 255) / 255);
  const g = srgbToLinear(((n >> 8) & 255) / 255);
  const b = srgbToLinear((n & 255) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

const round = (value: number, places: number) =>
  Math.round(value * 10 ** places) / 10 ** places;

export function oklch(l: number, c: number, h: number) {
  const chroma = round(c, 4);
  // An achromatic colour has no meaningful hue.
  return `oklch(${round(l * 100, 2)}% ${chroma} ${chroma === 0 ? 0 : round(h, 2)})`;
}

/** Writes any #rrggbb as oklch(); other colour syntaxes pass through. */
export function toOklch(color: string) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
  const [l, c, h] = hexToOklch(color);
  return oklch(l, c, h);
}

/** Spreads colour stops evenly across [start, end] percent, as Iron Link does today. */
export function distributeStops(colors: string[], start: number, end: number) {
  return colors
    .map((color, index) => {
      const position =
        colors.length === 1
          ? start
          : start + ((end - start) * index) / (colors.length - 1);
      return `${toOklch(color)} ${round(position, 2)}%`;
    })
    .join(", ");
}
