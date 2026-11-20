import { useBreakpoint } from "./useBreakpoint";

/**
 * Whether the screen is narrower than the `md` breakpoint (900px). The
 * library's version of the app's `useIsMobile` (`src/hooks/useIsMobile.ts`),
 * at the same width.
 */
export function useIsMobile() {
  return useBreakpoint("smaller-than", "md");
}
