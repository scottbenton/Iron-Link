export type HeadingComponent = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

// The element for a heading written at `level` (1 to 6) when the surface it
// sits in is nested `offset` levels deep, kept within h1 to h6.
export function getHeadingComponent(
  level: number,
  offset = 0,
): HeadingComponent {
  const nested = Math.min(Math.max(Math.round(level + offset), 1), 6);
  return `h${nested}` as HeadingComponent;
}
