import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useIsMobile } from "../../hooks/useIsMobile";

export type GamePageTier = "phone" | "medium" | "wide";

/**
 * Story-only: which of the app's three game page layouts the window gets.
 * The app decides with `useIsMobile()` (below the 900px `md` breakpoint)
 * and `useIsBreakpoint("greater-than", "lg")` (1200px), and so does this:
 * phone below 900px, medium to 1200px, wide from there.
 */
export function useGamePageTier(): GamePageTier {
  const isMobile = useIsMobile();
  const isWide = useBreakpoint("greater-than", "lg");
  if (isMobile) return "phone";
  return isWide ? "wide" : "medium";
}
