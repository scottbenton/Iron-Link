import { useContext, useLayoutEffect } from "react";

import { SidebarHeaderSlotContext } from "./sidebarHeaderSlot";

/**
 * Where a stacked sidebar panel's header controls go instead of its header:
 * put it in the panel's top row, such as a `SectionTabWell`'s `end`. While
 * it is mounted, the panel's visible header (title and controls) is dropped
 * and its title stays as a screen reader h2, so the column keeps its
 * heading. Renders nothing outside a stacked sidebar, or while the panel
 * shows over the page from the rail, where the header keeps Keep Open and
 * Close.
 */
export function SidebarHeaderEnd() {
  const slot = useContext(SidebarHeaderSlotContext);
  const claim = slot?.claim;
  const panelId = slot?.panelId;
  useLayoutEffect(() => {
    if (!claim || panelId === undefined) return;
    return claim(panelId);
  }, [claim, panelId]);
  return slot?.claimed ? <>{slot.end}</> : null;
}
