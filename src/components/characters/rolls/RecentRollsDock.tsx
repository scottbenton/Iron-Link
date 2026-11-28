import { useRef } from "react";
import { createPortal } from "react-dom";

import { useIsModalOpen } from "ui/hooks/useIsModalOpen";

import { DockedRecentRolls } from "./DockedRecentRolls";
import { useDockAnchor } from "./useDockAnchor";

/**
 * The recent roll cards on a phone's game page, docked above the bottom
 * nav: the newest in full, the others behind it and in the sheet. While it
 * is shown, it shows the cards in place of the page's toasts. Place it in
 * a positioned box at the page's foot (the bottom nav's): it sits just above
 * that box, 16px in from each side.
 *
 * The dock renders outside the page, fixed over that spot, so a modal that
 * opens over the page leaves it where it is, above the modal, as the toasts
 * stay on wider screens. In the page, the shell's container query would
 * keep it under any modal.
 */
export function RecentRollsDock() {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const position = useDockAnchor(anchorRef);
  const isModalOpen = useIsModalOpen();

  return (
    <>
      <span ref={anchorRef} hidden />
      {position &&
        createPortal(
          <div className="ui-root" style={{ display: "contents", ...position }}>
            <DockedRecentRolls aboveModals={isModalOpen} />
          </div>,
          document.body,
        )}
    </>
  );
}
