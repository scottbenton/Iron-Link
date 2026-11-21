import { ReactNode, createContext } from "react";

export interface SidebarHeaderSlot {
  panelId: string;
  /** The header's controls: the panel's actions, then Collapse. */
  end: ReactNode;
  /** Whether the header has handed its controls to this panel's content. */
  claimed: boolean;
  /** Called by `SidebarHeaderEnd` while mounted; returns the release. */
  claim: (panelId: string) => () => void;
}

export const SidebarHeaderSlotContext = createContext<SidebarHeaderSlot | null>(
  null,
);
