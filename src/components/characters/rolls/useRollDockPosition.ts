import { GAME_BOTTOM_NAV_CLEARANCE } from "pages/games/gamePageLayout/gameBottomNavItems";

import { useIsMobile } from "hooks/useIsMobile";

import { useAppState } from "stores/appState.store";

// The gap between the roll stack and what it sits on (the bottom nav, or the
// bottom of the window), and between it and the snackbars above it.
export const ROLL_DOCK_GAP = 8;
// The stack's distance from the window's edges on wider screens.
export const ROLL_DOCK_WIDE_INSET = 16;
// The stack's width on wider screens; phones use the full width.
export const ROLL_DOCK_WIDE_WIDTH = 360;

export interface RollDockPosition {
  isMobile: boolean;
  // The dock's `bottom`, as a CSS length.
  bottom: string;
}

export function getRollDockBottom(
  isMobile: boolean,
  isBottomNavVisible: boolean,
): string {
  if (!isMobile) return `${ROLL_DOCK_WIDE_INSET}px`;
  if (isBottomNavVisible) {
    return `calc(${GAME_BOTTOM_NAV_CLEARANCE} + ${ROLL_DOCK_GAP}px)`;
  }
  return `calc(env(safe-area-inset-bottom, 0px) + ${ROLL_DOCK_GAP}px)`;
}

// Where the roll stack docks: on phones just above the game's bottom nav (or
// the bottom of the window while the nav is hidden for the keyboard, or
// outside a game), on wider screens in the bottom right corner.
export function useRollDockPosition(): RollDockPosition {
  const isMobile = useIsMobile();
  const isBottomNavVisible = useAppState(
    (state) => state.isGameBottomNavVisible,
  );
  return { isMobile, bottom: getRollDockBottom(isMobile, isBottomNavVisible) };
}
