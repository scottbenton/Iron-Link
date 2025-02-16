import { Datasworn } from "@datasworn/core";
import ChevronIcon from "@mui/icons-material/ChevronRight";
import { Collapse, ListItem, ListItemButton } from "@mui/material";
import { ListItemText } from "@mui/material";
import { ListItemIcon } from "@mui/material";
import { useState } from "react";

import { Move } from "../Move";
import {
  ItemVisibility,
  VisibilitySettings,
} from "../_helpers/getCollectionVisibility";

export interface MoveListItemProps {
  move: Datasworn.Move;
  disabled?: boolean;
  visibilitySettings: VisibilitySettings;
  isSearchActive: boolean;
  isFullCollectionVisible: boolean;
}

export function MoveListItem(props: MoveListItemProps) {
  const {
    move,
    disabled,
    visibilitySettings,
    isSearchActive,
    isFullCollectionVisible,
  } = props;

  let moveVisibility = ItemVisibility.Visible;
  if (isSearchActive && !isFullCollectionVisible) {
    moveVisibility =
      visibilitySettings.itemVisibility[move._id] ?? ItemVisibility.Hidden;
  }

  const [isExpanded, setIsExpanded] = useState(false);

  if (moveVisibility === ItemVisibility.Hidden) {
    return null;
  }

  return (
    <>
      <ListItem
        disablePadding
        sx={(theme) => ({
          bgcolor:
            theme.palette.grey[theme.palette.mode === "light" ? 100 : 800],
        })}
      >
        <ListItemButton
          disabled={disabled}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <ListItemText>{move.name}</ListItemText>
          <ListItemIcon sx={{ minWidth: "unset" }}>
            <ChevronIcon
              sx={(theme) => ({
                transform: `rotate(${isExpanded ? "-90deg" : "0deg"})`,
                transition: theme.transitions.create(["transform"], {
                  duration: theme.transitions.duration.shorter,
                }),
              })}
            />
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      <Collapse unmountOnExit in={isExpanded}>
        <Move moveId={move._id} hideMoveName sx={{ px: 2, py: 1 }} />
      </Collapse>
    </>
  );
}
