import { useIsModalOpen } from "ui/hooks/useIsModalOpen";

import { DockedRecentRolls } from "./DockedRecentRolls";

/**
 * The recent roll cards on a phone's game page, docked above the bottom
 * nav: the newest in full, the others behind it and in the sheet. While it
 * is shown, it shows the cards in place of the page's toasts. Place it in
 * a positioned box at the page's foot (the bottom nav's): it sits just above
 * that box, 16px in from each side.
 *
 * A library modal covers the page, dock included, so while one is open the
 * cards go back to the toasts, which sit above modals.
 */
export function RecentRollsDock() {
  const isModalOpen = useIsModalOpen();
  return isModalOpen ? null : <DockedRecentRolls />;
}
