/**
 * SVG geometry for the clock's dials, in a 100 by 100 box centred on 50,50
 * (the bar uses its own 100 by 14 box). Angles are degrees clockwise from
 * twelve o'clock.
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
 * A wedge pushed out along its middle, so neighbours part by `gap` units
 * along their whole edge (a hairline of nothing, not a drawn line). The
 * radius shrinks by the same push, so the dial still fits its box.
 */
export function gappedWedgePath(
  index: number,
  segments: number,
  gap: number,
): string {
  if (segments <= 1) return circlePath(48);
  const angle = 360 / segments;
  const half = (Math.PI * angle) / 360;
  const push = gap / (2 * Math.sin(Math.min(half, Math.PI / 2)));
  const r = 50 - push;
  const start = angle * index;
  const end = start + angle;
  const mid = start + angle / 2;
  const radians = (Math.PI * mid) / 180;
  const cx = 50 + push * Math.sin(radians);
  const cy = 50 - push * Math.cos(radians);
  const large = angle > 180 ? 1 : 0;
  return `M ${round(cx)} ${round(cy)} L ${point(r, start, cx, cy)} A ${r} ${r} 0 ${large} 1 ${point(r, end, cx, cy)} Z`;
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

/** Centre of the pip for a segment, placed at the segment's middle. */
export function pipCentre(
  index: number,
  segments: number,
  r: number,
): { x: number; y: number } {
  const degrees = (360 / segments) * (index + 0.5);
  const radians = (Math.PI * degrees) / 180;
  return {
    x: round(50 + r * Math.sin(radians)),
    y: round(50 - r * Math.cos(radians)),
  };
}

/** Pip radius: as large as fits the ring with room between, up to `max`. */
export function pipRadius(segments: number, ring: number, max: number) {
  return Math.min(max, ((Math.PI * ring) / segments) * 0.38);
}

/** A short tick on the rim at a segment boundary, from `inner` to `outer`. */
export function rimTick(
  boundary: number,
  segments: number,
  inner: number,
  outer: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const degrees = (360 / segments) * boundary;
  const radians = (Math.PI * degrees) / 180;
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  return {
    x1: round(50 + inner * sin),
    y1: round(50 - inner * cos),
    x2: round(50 + outer * sin),
    y2: round(50 - outer * cos),
  };
}

/** One cell of the notched bar in its 100 by 14 box. */
export function barCell(
  index: number,
  segments: number,
  gap: number,
): { x: number; width: number } {
  const width = (100 - gap * (segments - 1)) / segments;
  return { x: round(index * (width + gap)), width: round(width) };
}
