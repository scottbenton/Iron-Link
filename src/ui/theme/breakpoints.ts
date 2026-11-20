/**
 * The breakpoints' widths in pixels. Panda's `breakpoints` (panda.config.ts)
 * and `useBreakpoint` both read them, so CSS conditions such as `smDown` and
 * the hook switch at the same pixel.
 */
export const breakpointWidths = {
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

export type Breakpoint = keyof typeof breakpointWidths;
