import {
  ArrowCounterClockwiseIcon,
  DotsThreeIcon,
  MonitorPlayIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";

import { IconButton } from "../../components/IconButton";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "../../components/Menu";
import type { TracksPanelStrings } from "./tracksPanelStrings";

export interface TrackMenuProps {
  label: string;
  isClock: boolean;
  onEdit?: () => void;
  /**
   * Reopens a completed track. Completing is the card's own button, beside
   * its roll, so it is not in the menu.
   */
  onReopen?: () => void;
  onDelete?: () => void;
  /** Whether it shows on the second screen; the item is offered when set. */
  onSecondScreen?: boolean;
  onSecondScreenChange?: (open: boolean) => void;
  strings: TracksPanelStrings;
}

/**
 * A track's or clock's ⋯ menu: Edit, Reopen (once completed), Second
 * Screen and Delete. Marking progress, the roll and Complete stay on the
 * card. Renders nothing with no items.
 */
export function TrackMenu(props: TrackMenuProps) {
  const {
    label,
    isClock,
    onEdit,
    onReopen,
    onDelete,
    onSecondScreen,
    onSecondScreenChange,
    strings,
  } = props;

  const showSecondScreen = !!onSecondScreenChange;
  if (!onEdit && !onReopen && !onDelete && !showSecondScreen) {
    return null;
  }

  return (
    <Menu>
      <MenuTrigger
        render={
          <IconButton label={strings.optionsLabel(label)} size="sm">
            <DotsThreeIcon weight="bold" />
          </IconButton>
        }
      />
      <MenuContent align="end">
        {onEdit && (
          <MenuItem icon={<PencilSimpleIcon />} onClick={onEdit}>
            {strings.edit(isClock)}
          </MenuItem>
        )}
        {onReopen && (
          <MenuItem icon={<ArrowCounterClockwiseIcon />} onClick={onReopen}>
            {strings.reopen(isClock)}
          </MenuItem>
        )}
        {showSecondScreen && (
          <MenuItem
            icon={<MonitorPlayIcon />}
            onClick={() => onSecondScreenChange(!onSecondScreen)}
          >
            {onSecondScreen
              ? strings.closeOnSecondScreen
              : strings.openOnSecondScreen}
          </MenuItem>
        )}
        {onDelete && (
          <>
            {(onEdit || onReopen || showSecondScreen) && <MenuSeparator />}
            <MenuItem icon={<TrashIcon />} tone="danger" onClick={onDelete}>
              {strings.remove(isClock)}
            </MenuItem>
          </>
        )}
      </MenuContent>
    </Menu>
  );
}
