// Gives `window.matchMedia` a window of this width, for code that picks a
// layout from media queries. Evaluates the width conditions MUI and the
// library write: "(min-width:900px)", "(max-width:899.95px)",
// "(width >= 56.25rem)", "(width < 37.5rem)", joined with "and". Anything
// else (the theme's prefers-color-scheme) does not match.

const PIXELS_PER_REM = 16;

export function matchesWidth(query: string, width: number) {
  if (!/width/.test(query)) return false;
  const conditions = query.replace(/^@media\s*/, "").split(/\s+and\s+/);
  return conditions.every((condition) => {
    const match = condition.match(
      /\(\s*(min-width|max-width|width)\s*(:|>=|<=|<|>)\s*([\d.]+)(px|rem|em)\s*\)/,
    );
    if (!match) throw new Error(`Unsupported media query: ${condition}`);
    const [, feature, operator, value, unit] = match;
    const pixels = Number(value) * (unit === "px" ? 1 : PIXELS_PER_REM);
    if (feature === "min-width") return width >= pixels;
    if (feature === "max-width") return width <= pixels;
    if (operator === ">=") return width >= pixels;
    if (operator === ">") return width > pixels;
    if (operator === "<=") return width <= pixels;
    return width < pixels;
  });
}

/** Replaces `window.matchMedia`; returns a function that puts it back. */
export function mockWindowWidth(width: number) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: matchesWidth(query, width),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}
