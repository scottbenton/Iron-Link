export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingComponent = `h${HeadingLevel}`;

/**
 * The level of a heading written at `level` (1 to 6) when the surface it sits
 * in is nested `offset` levels deep, kept within 1 to 6.
 */
export function getHeadingLevel(level: number, offset = 0): HeadingLevel {
  return Math.min(Math.max(Math.round(level + offset), 1), 6) as HeadingLevel;
}

/** The element for a heading written at `level`, nested `offset` deep. */
export function getHeadingComponent(
  level: number,
  offset = 0,
): HeadingComponent {
  return `h${getHeadingLevel(level, offset)}`;
}
