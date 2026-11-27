import { useBreakpoint } from "ui/hooks/useBreakpoint";
import { useIsMobile } from "ui/hooks/useIsMobile";

export type GamePageTier = "phone" | "compact" | "medium" | "wide";

/**
 * Which of the game page's layouts the window gets: the phone page below
 * 600px; from 600px the sheet and the reference on one rail, opening over
 * the notes (compact); from 900px the sheet over the reference beside the
 * notes (medium); from 1200px the three columns side by side (wide).
 */
export function useGamePageTier(): GamePageTier {
  const isMobile = useIsMobile();
  const isMedium = useBreakpoint("greater-than", "md");
  const isWide = useBreakpoint("greater-than", "lg");
  if (isMobile) return "phone";
  if (isWide) return "wide";
  return isMedium ? "medium" : "compact";
}
