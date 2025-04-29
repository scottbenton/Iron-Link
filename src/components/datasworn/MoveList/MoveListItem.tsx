import { ListItem } from "@/components/common/ListItem";
import { Collapsible, Icon } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";
import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";

import { Move } from "../Move/Move";
import { ItemVisibility, VisibilitySettings } from "../getCollectionVisibility";

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
        bgColor="bg.subtle"
        disabled={disabled}
        onClick={() => setIsExpanded((prev) => !prev)}
        label={move.name}
        secondaryAction={
          <Icon
            asChild
            size="sm"
            transform={`rotate(${isExpanded ? "-90deg" : "0deg"})`}
            transition="transform"
            transitionDuration={"moderate"}
            transitionTimingFunction={"ease-in-out"}
            color="fg.subtle"
          >
            <ChevronRightIcon />
          </Icon>
        }
      />
      <Collapsible.Root open={isExpanded} lazyMount unmountOnExit>
        <Collapsible.Content>
          <Move moveId={move._id} hideMoveName px={4} py={2} />
        </Collapsible.Content>
      </Collapsible.Root>
    </>
  );
}
