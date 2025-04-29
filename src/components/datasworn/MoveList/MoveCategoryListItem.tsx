import { List, ListItem } from "@/components/common/ListItem";
import { MoveCategoryMap, MoveMap } from "@/stores/dataswornTree.store";
import { Collapsible, Icon } from "@chakra-ui/react";
import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";

import {
  CollectionVisibility,
  VisibilitySettings,
} from "../getCollectionVisibility";
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
        bgColor={"bg.muted"}
        mt={isExpanded ? 1 : 0}
        transition="margin"
        transitionDuration="moderate"
        transitionTimingFunction="ease-in-out"
        label={moveCategory.name}
        onClick={
          isSearchActive ? undefined : () => setIsExpanded((prev) => !prev)
        }
        disabled={disabled}
        secondaryAction={
          <Icon
            asChild
            transform={`rotate(${isExpandedOrForced ? "-" : ""}90deg)`}
            transition="transform"
            transitionTimingFunction={"ease-in-out"}
            transitionDuration={"moderate"}
            color="fg.subtle"
            size="sm"
          >
            <ChevronRightIcon />
          </Icon>
        }
      />
      <Collapsible.Root open={isExpandedOrForced} lazyMount>
        <Collapsible.Content>
          <List mb={isExpandedOrForced ? 1 : 0}>
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
          </List>
        </Collapsible.Content>
      </Collapsible.Root>
    </>
  );
}
