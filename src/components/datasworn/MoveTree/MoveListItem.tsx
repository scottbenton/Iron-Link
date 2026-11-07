import { Datasworn } from "@datasworn-community/core";
import ChevronIcon from "@mui/icons-material/ChevronRight";
import { Collapse, ListItem, ListItemButton } from "@mui/material";
import { ListItemText } from "@mui/material";
import { ListItemIcon } from "@mui/material";
import { useId, useState } from "react";

import { LinkComponent } from "components/LinkComponent";

import { Move } from "../Move";
import {
  ItemVisibility,
  VisibilitySettings,
} from "../_helpers/getCollectionVisibility";
import { useTreeLinkMode } from "../_helpers/treeLinkMode";

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
  const contentId = useId();
  const linkMode = useTreeLinkMode();

  if (moveVisibility === ItemVisibility.Hidden) {
    return null;
  }

  if (linkMode) {
    const isSelected = linkMode.selectedId === move._id;
    return (
      <ListItem
        disablePadding
        secondaryAction={linkMode.renderItemAction?.(move)}
        sx={(theme) => ({
          bgcolor:
            theme.palette.grey[theme.palette.mode === "light" ? 100 : 800],
        })}
      >
        <ListItemButton
          component={LinkComponent}
          href={linkMode.getHref(move._id) ?? ""}
          disabled={disabled}
          selected={isSelected}
          aria-current={isSelected ? "page" : undefined}
        >
          <ListItemText>{move.name}</ListItemText>
        </ListItemButton>
      </ListItem>
    );
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
          aria-expanded={isExpanded}
          aria-controls={isExpanded ? contentId : undefined}
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
      <Collapse unmountOnExit in={isExpanded} id={contentId}>
        <Move moveId={move._id} hideMoveName sx={{ px: 2, py: 1 }} />
      </Collapse>
    </>
  );
}
