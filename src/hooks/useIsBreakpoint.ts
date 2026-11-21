import { useMediaQuery } from "ui/hooks/useMediaQuery";
import { Breakpoint, breakpointWidths } from "ui/theme/breakpoints";

export type BreakpointComparator = "greater-than" | "smaller-than" | "equal-to";

const order: Breakpoint[] = ["sm", "md", "lg", "xl"];

// The query MUI writes for the same breakpoint (`theme.breakpoints.up`,
// `down`, `only`), in pixels and min/max syntax, so the hook switches where
// the app's MUI styles do. The library's own `useBreakpoint` writes Panda's
// rem range queries instead; screens moving to the library switch to it.
export function getAppBreakpointQuery(
  comparator: BreakpointComparator,
  breakpoint: Breakpoint,
): string {
  const width = breakpointWidths[breakpoint];
  if (comparator === "greater-than") return `(min-width:${width}px)`;
  if (comparator === "smaller-than") return `(max-width:${width - 0.05}px)`;
  const next = order[order.indexOf(breakpoint) + 1];
  return next
    ? `(min-width:${width}px) and (max-width:${breakpointWidths[next] - 0.05}px)`
    : `(min-width:${width}px)`;
}

/**
 * Whether the screen is above, below or within a breakpoint. The widths come
 * from the library's table (`ui/theme/breakpoints.ts`), which MUI's theme
 * reads too, so the app, MUI and the library share one source.
 */
export function useIsBreakpoint(
  comparator: BreakpointComparator,
  breakpoint: Breakpoint,
): boolean {
  return useMediaQuery(getAppBreakpointQuery(comparator, breakpoint));
}
