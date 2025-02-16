import ChevronIcon from "@mui/icons-material/ChevronRight";
import {
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { ListItemIcon } from "@mui/material";
import { useState } from "react";

import { MoveCategoryMap, MoveMap } from "stores/dataswornTree.store";

import {
  CollectionVisibility,
  VisibilitySettings,
} from "../_helpers/getCollectionVisibility";
import { MoveListItem } from "./MoveListItem";

export interface MoveCategoryListItemProps {
  moveCategoryId: string;
  moveCategoryMap: MoveCategoryMap;
  moveMap: MoveMap;
  disabled?: boolean;
  visibilitySettings: VisibilitySettings;
  isSearchActive: boolean;
  isFullCategoryVisible?: boolean;
}

export function MoveCategoryListItem(props: MoveCategoryListItemProps) {
  const {
    moveCategoryId,
    moveCategoryMap,
    moveMap,
    disabled,
    visibilitySettings,
    isSearchActive,
    isFullCategoryVisible,
  } = props;

  const moveCategory = moveCategoryMap[moveCategoryId];

  const [isExpanded, setIsExpanded] = useState(false);

  let categoryVisibilityState = CollectionVisibility.All;
  if (isSearchActive && !isFullCategoryVisible) {
    categoryVisibilityState =
      visibilitySettings.collectionVisibility[moveCategoryId] ??
      CollectionVisibility.Hidden;
  }

  if (
    !moveCategory ||
    categoryVisibilityState === CollectionVisibility.Hidden
  ) {
    return null;
  }

  const isExpandedOrForced = isExpanded || isSearchActive;

  return (
    <>
      <ListItem
        disablePadding={!isSearchActive}
        sx={(theme) => ({
          bgcolor: "background.default",
          mt: isExpanded ? 0.5 : 0,
          color: theme.palette.grey[theme.palette.mode === "light" ? 700 : 200],
          ...theme.typography.body1,
          fontFamily: theme.typography.fontFamilyTitle,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: theme.transitions.create(["margin"], {
            duration: theme.transitions.duration.shorter,
          }),
        })}
      >
        {isSearchActive ? (
          <ListItemText>{moveCategory.name}</ListItemText>
        ) : (
          <ListItemButton
            disabled={disabled || isSearchActive}
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <ListItemText>{moveCategory.name}</ListItemText>
            <ListItemIcon sx={{ minWidth: "unset" }}>
              <ChevronIcon
                sx={(theme) => ({
                  transform: `rotate(${isExpanded ? "-" : ""}90deg)`,
                  transition: theme.transitions.create(["transform"], {
                    duration: theme.transitions.duration.shorter,
                  }),
                })}
              />
            </ListItemIcon>
          </ListItemButton>
        )}
      </ListItem>

      <Collapse unmountOnExit in={isExpandedOrForced}>
        <List sx={{ py: 0, mb: isExpandedOrForced ? 0.5 : 0 }}>
          {Object.values(moveCategory.contents).map((move) => (
            <MoveListItem
              key={moveCategory._id + "-" + move._id}
              move={move}
              disabled={!isExpandedOrForced || disabled}
              visibilitySettings={visibilitySettings}
              isSearchActive={isSearchActive}
              isFullCollectionVisible={
                categoryVisibilityState === CollectionVisibility.All
              }
            />
          ))}
          {Object.values(moveCategory.collections).map((subCollection) => (
            <MoveCategoryListItem
              key={moveCategory._id + "-" + subCollection._id}
              disabled={!isExpandedOrForced || disabled}
              moveCategoryId={subCollection._id}
              moveCategoryMap={moveCategoryMap}
              moveMap={moveMap}
              visibilitySettings={visibilitySettings}
              isSearchActive={isSearchActive}
              isFullCategoryVisible={
                categoryVisibilityState === CollectionVisibility.All
              }
            />
          ))}
        </List>
      </Collapse>
    </>
  );
}
