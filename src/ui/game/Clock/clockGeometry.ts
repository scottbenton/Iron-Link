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

/**
 * One arc of a segmented ring. Neighbouring arcs are `gap` units apart, the
 * same width from the outer edge to the inner one: each edge is offset from
 * its radius by half the gap, so a gap does not taper toward the middle.
 */
export function ringSegmentPath(
  index: number,
  segments: number,
  outer: number,
  inner: number,
  gap: number,
): string {
  if (segments <= 1) {
    return `${circlePath(outer)} ${circlePath(inner)}`;
  }
  const angle = 360 / segments;
  const offset = (r: number) =>
    (Math.asin(Math.min(gap / 2 / r, 1)) * 180) / Math.PI;
  const start = angle * index;
  const end = start + angle;
  const outerStart = start + offset(outer);
  const outerEnd = end - offset(outer);
  const innerStart = start + offset(inner);
  const innerEnd = end - offset(inner);
  const largeOuter = outerEnd - outerStart > 180 ? 1 : 0;
  const largeInner = innerEnd - innerStart > 180 ? 1 : 0;
  return [
    `M ${point(outer, outerStart)}`,
    `A ${outer} ${outer} 0 ${largeOuter} 1 ${point(outer, outerEnd)}`,
    `L ${point(inner, innerEnd)}`,
    `A ${inner} ${inner} 0 ${largeInner} 0 ${point(inner, innerStart)}`,
    "Z",
  ].join(" ");
}

/** A full circle as a path (two half arcs). */
export function circlePath(r: number): string {
  return `M 50 ${50 - r} A ${r} ${r} 0 1 1 50 ${50 + r} A ${r} ${r} 0 1 1 50 ${50 - r} Z`;
}
