import {
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
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
  completed: boolean;
  onEdit?: () => void;
  onCompletedChange?: (completed: boolean) => void;
  onDelete?: () => void;
  /** Whether it shows on the second screen; the item is offered when set. */
  onSecondScreen?: boolean;
  onSecondScreenChange?: (open: boolean) => void;
  strings: TracksPanelStrings;
}

/**
 * A track's or clock's ⋯ menu: what the live card spread over a row of
 * buttons (Edit, Complete or Reopen, Second Screen, Delete). Marking
 * progress and the roll stay on the card. Renders nothing with no items.
 */
export function TrackMenu(props: TrackMenuProps) {
  const {
    label,
    isClock,
    completed,
    onEdit,
    onCompletedChange,
    onDelete,
    onSecondScreen,
    onSecondScreenChange,
    strings,
  } = props;

  const showSecondScreen = !!onSecondScreenChange;
  if (!onEdit && !onCompletedChange && !onDelete && !showSecondScreen) {
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
        {onCompletedChange &&
          (completed ? (
            <MenuItem
              icon={<ArrowCounterClockwiseIcon />}
              onClick={() => onCompletedChange(false)}
            >
              {strings.reopen(isClock)}
            </MenuItem>
          ) : (
            <MenuItem
              icon={<CheckCircleIcon />}
              onClick={() => onCompletedChange(true)}
            >
              {strings.complete(isClock)}
            </MenuItem>
          ))}
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
            {(onEdit || onCompletedChange || showSecondScreen) && (
              <MenuSeparator />
            )}
            <MenuItem icon={<TrashIcon />} tone="danger" onClick={onDelete}>
              {strings.remove(isClock)}
            </MenuItem>
          </>
        )}
      </MenuContent>
    </Menu>
  );
}
