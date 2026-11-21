import { useBreakpoint } from "./useBreakpoint";

/**
 * Whether the screen is phone width: narrower than the `sm` breakpoint
 * (600px), the CSS's `smDown`. The app's own `useIsMobile`
 * (`src/hooks/useIsMobile.ts`) still switches at 900px; screens that move
 * to the library switch at 600px, and from 600 to 900px get the wide
 * layout with its sidebars on a rail.
 */
export function useIsMobile() {
  return useBreakpoint("smaller-than", "sm");
}
