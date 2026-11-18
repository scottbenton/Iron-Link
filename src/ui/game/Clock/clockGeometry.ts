/**
 * SVG geometry for the clock's dial, in a 100 by 100 box centred on 50,50.
 * Angles are degrees clockwise from twelve o'clock.
 */

const round = (n: number) => Math.round(n * 1000) / 1000;

function point(r: number, degrees: number, cx = 50, cy = 50): string {
  const radians = (Math.PI * degrees) / 180;
  return `${round(cx + r * Math.sin(radians))} ${round(cy - r * Math.cos(radians))}`;
}

/** A whole pie wedge, edge to edge, used as the pointer target. */
export function wedgePath(index: number, segments: number, r = 50): string {
  if (segments <= 1) return circlePath(r);
  const angle = 360 / segments;
  const start = angle * index;
  const end = start + angle;
  const large = angle > 180 ? 1 : 0;
  return `M 50 50 L ${point(r, start)} A ${r} ${r} 0 ${large} 1 ${point(r, end)} Z`;
}

/** One arc of a segmented ring, with `gap` units between arcs. */
export function ringSegmentPath(
  index: number,
  segments: number,
  outer: number,
  inner: number,
  gap: number,
): string {
  const angle = 360 / segments;
  const middle = (outer + inner) / 2;
  const gapDegrees = segments > 1 ? (gap / middle) * (180 / Math.PI) : 0;
  const start = angle * index + gapDegrees / 2;
  const end = angle * (index + 1) - gapDegrees / 2;
  if (segments <= 1) {
    return `${circlePath(outer)} ${circlePath(inner)}`;
  }
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${point(outer, start)}`,
    `A ${outer} ${outer} 0 ${large} 1 ${point(outer, end)}`,
    `L ${point(inner, end)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${point(inner, start)}`,
    "Z",
  ].join(" ");
}

/** A full circle as a path (two half arcs). */
export function circlePath(r: number): string {
  return `M 50 ${50 - r} A ${r} ${r} 0 1 1 50 ${50 + r} A ${r} ${r} 0 1 1 50 ${50 - r} Z`;
}
