import { ReactElement } from "react";

import { MenuContentProps } from "../../components/Menu";
import { SettingsMenuAction } from "./settingsMenuSections";
import { SettingsMenuStrings } from "./settingsMenuStrings";

export type PendingDelete = "character" | "game" | null;

interface MenuOpenProps {
  /** Controls whether the menu is open. */
  open?: boolean;
  /** Opens the menu on first render, for stories and tests. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface SharedMenuProps extends MenuOpenProps {
  /** Called with the item chosen. Theme opens the Theme dialog. */
  onSelect: (action: SettingsMenuAction) => void;
  /** Called after the person confirms Delete Character. */
  onDeleteCharacter?: () => void;
  /** Replaces the trigger button. It must forward refs and props. */
  trigger?: ReactElement;
  /** Where the menu opens against its trigger. */
  side?: MenuContentProps["side"];
  align?: MenuContentProps["align"];
  /** The default trigger's tooltip side. */
  tooltipSide?: "top" | "bottom" | "left" | "right";
  strings?: Partial<SettingsMenuStrings>;
}
