import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useIsMobile } from "../../hooks/useIsMobile";

export type GamePageTier = "phone" | "compact" | "medium" | "wide";

/**
 * Story-only: which of the game page's layouts the window gets. The
 * library's `useIsMobile()` (below the 600px `sm` breakpoint) picks the
 * phone page; `md` (900px) and `lg` (1200px) split the rest: compact from
 * 600px (both sidebars on one rail, opening as flyouts), medium from 900px
 * (the sheet over the reference beside the notes) and wide from 1200px.
 */
export function useGamePageTier(): GamePageTier {
  const isMobile = useIsMobile();
  const isMedium = useBreakpoint("greater-than", "md");
  const isWide = useBreakpoint("greater-than", "lg");
  if (isMobile) return "phone";
  if (isWide) return "wide";
  return isMedium ? "medium" : "compact";
}
