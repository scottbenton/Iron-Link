import { List, ListItem } from "@/components/common/ListItem";
import { Collapsible, Icon } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";
import { ChevronRightIcon } from "lucide-react";
import { useState } from "react";

import {
  CollectionVisibility,
  VisibilitySettings,
} from "../getCollectionVisibility";
import { OracleListItem } from "./OracleListItem";
import { OracleTableSharedTextListItem } from "./OracleTableSharedTextListItem";

export interface OracleCollectionListItemProps {
  oracleCollectionId: string;
  oracleCollectionMap: Record<string, Datasworn.OracleCollection>;
  oracleRollableMap: Record<string, Datasworn.AnyOracleRollable>;
  disabled?: boolean;
  visibilitySettings: VisibilitySettings;
  isSearchActive: boolean;
  isFullCollectionVisible?: boolean;
}

export function OracleCollectionListItem(props: OracleCollectionListItemProps) {
  const {
    oracleCollectionId,
    oracleCollectionMap,
    oracleRollableMap,
    disabled,
    visibilitySettings,
    isSearchActive,
    isFullCollectionVisible,
  } = props;

  const oracleCollection = oracleCollectionMap[oracleCollectionId];

  const [isExpanded, setIsExpanded] = useState(false);

  let collectionVisibilityState = CollectionVisibility.All;
  if (isSearchActive && !isFullCollectionVisible) {
    collectionVisibilityState =
      visibilitySettings.collectionVisibility[oracleCollectionId] ??
      CollectionVisibility.Hidden;
  }

  if (
    !oracleCollection ||
    collectionVisibilityState === CollectionVisibility.Hidden
  ) {
    return null;
  }

  const isExpandedOrForced = isExpanded || isSearchActive;

  if (
    oracleCollection.oracle_type === "table_shared_text" ||
    oracleCollection.oracle_type === "table_shared_text2" ||
    oracleCollection.oracle_type === "table_shared_text3"
  ) {
    return (
      <OracleTableSharedTextListItem
        collection={oracleCollection}
        disabled={disabled}
      />
    );
  }

  return (
    <>
      <ListItem
        bg="bg.muted"
        mt={isExpanded ? 1 : 0}
        color="text.muted"
        transition="margin"
        transitionDuration={"moderate"}
        transitionTimingFunction="ease-in-out"
        onClick={
          isSearchActive ? undefined : () => setIsExpanded((prev) => !prev)
        }
        disabled={disabled || isSearchActive}
        label={oracleCollection.name}
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
            {oracleCollection.oracle_type === "tables" &&
              Object.values(oracleCollection.collections)
                .sort(sortOracleSubCollections)
                .map((subCollection) => (
                  <OracleCollectionListItem
                    key={oracleCollection._id + "-" + subCollection._id}
                    disabled={!isExpandedOrForced || disabled}
                    oracleCollectionId={subCollection._id}
                    oracleCollectionMap={oracleCollectionMap}
                    oracleRollableMap={oracleRollableMap}
                    visibilitySettings={visibilitySettings}
                    isSearchActive={isSearchActive}
                    isFullCollectionVisible={
                      collectionVisibilityState === CollectionVisibility.All
                    }
                  />
                ))}
            {Object.values(oracleCollection.contents).map((oracle) => (
              <OracleListItem
                key={oracleCollection._id + "-" + oracle._id}
                oracle={oracle}
                disabled={!isExpandedOrForced || disabled}
                visibilitySettings={visibilitySettings}
                isSearchActive={isSearchActive}
                isFullCollectionVisible={
                  collectionVisibilityState === CollectionVisibility.All
                }
              />
            ))}
          </List>
        </Collapsible.Content>
      </Collapsible.Root>
    </>
  );
}

// Bubble tablesharedreesults to the top
const tableSharedTexts = [
  "table_shared_text",
  "table_shared_text2",
  "table_shared_text3",
];
function sortOracleSubCollections(
  c1: Datasworn.OracleCollection,
  c2: Datasworn.OracleCollection,
) {
  const isC1SharedText = tableSharedTexts.includes(c1.oracle_type);
  const isC2SharedText = tableSharedTexts.includes(c2.oracle_type);
  if (isC1SharedText && !isC2SharedText) {
    return -1;
  } else if (!isC1SharedText && isC2SharedText) {
    return 1;
  }
  return 0;
}
