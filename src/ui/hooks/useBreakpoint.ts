import { Breakpoint, breakpointWidths } from "../theme/breakpoints";
import { useMediaQuery } from "./useMediaQuery";

export type BreakpointComparator = "greater-than" | "smaller-than" | "equal-to";

const order: Breakpoint[] = ["sm", "md", "lg", "xl"];

/** A width in pixels as Panda writes it in its media queries (rem). */
function toRem(pixels: number) {
  return `${pixels / 16}rem`;
}

/**
 * The media query for a breakpoint, written exactly as Panda generates its
 * conditions: "smaller-than" is `smDown`/`mdDown`/..., "greater-than" is
 * `sm`/`md`/..., and "equal-to" is `smOnly`/`mdOnly`/... (from the
 * breakpoint up to just below the next; `xl` has no upper bound).
 */
export function getBreakpointQuery(
  comparator: BreakpointComparator,
  breakpoint: Breakpoint,
): string {
  const width = toRem(breakpointWidths[breakpoint]);
  if (comparator === "smaller-than") return `(width < ${width})`;
  if (comparator === "greater-than") return `(width >= ${width})`;
  const next = order[order.indexOf(breakpoint) + 1];
  return next
    ? `(width >= ${width}) and (width < ${toRem(breakpointWidths[next])})`
    : `(width >= ${width})`;
}

/**
 * Whether the screen is above, below or within a breakpoint, matching the
 * library's CSS conditions to the pixel. The same signature as the app's
 * `useIsBreakpoint`, so screens move over unchanged.
 */
export function useBreakpoint(
  comparator: BreakpointComparator,
  breakpoint: Breakpoint,
): boolean {
  return useMediaQuery(getBreakpointQuery(comparator, breakpoint));
}
