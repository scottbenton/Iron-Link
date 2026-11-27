import { Datasworn } from "@datasworn-community/core";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { Checkbox } from "ui/components/Checkbox";
import { Collapse } from "ui/components/Collapsible";
import { IconButton } from "ui/components/IconButton";
import { CaretRightIcon, Icon } from "ui/icons";
import { Box, HStack, Stack } from "ui/primitives";

export interface CollectionPlaysetProps {
  collection:
    | Datasworn.MoveCategory
    | Datasworn.AssetCollection
    | Datasworn.OracleCollection;
  excludedCollections: Record<string, boolean>;
  toggleExcludedCollection: (collectionId: string, isExcluded: boolean) => void;
  excludedItems: Record<string, boolean>;
  toggleExcludedItem: (itemId: string, isExcluded: boolean) => void;
  replacedCollections: Record<string, boolean>;
  replacedItems: Record<string, boolean>;
}

/**
 * A collection's checkbox, with a button that shows its subcollections and
 * items while it is included.
 */
export function CollectionPlayset(props: CollectionPlaysetProps) {
  const {
    collection,
    excludedCollections,
    toggleExcludedCollection,
    excludedItems,
    toggleExcludedItem,
    replacedItems,
  } = props;

  const { t } = useTranslation();
  const panelId = useId();

  const isExcluded = !!excludedCollections[collection._id];
  const isReplaced = !!props.replacedCollections[collection._id];
  const isIncluded = !isExcluded && !isReplaced;

  const [isExpanded, setIsExpanded] = useState(false);
  // Excluding or replacing a collection closes it, as before.
  if (isExpanded && !isIncluded) {
    setIsExpanded(false);
  }
  const isOpen = isExpanded && isIncluded;

  const status = isReplaced
    ? t("playset-editor.replaced", "This collection is replaced by another")
    : isExcluded
      ? t("playset-editor.excluded", "This collection is excluded")
      : undefined;

  return (
    <Box as="li">
      <HStack gap="1" alignItems="flex-start">
        <IconButton
          size="sm"
          label={
            isOpen
              ? t("playset-editor.hide-contents", "Hide {{name}}", {
                  name: collection.name,
                })
              : t("playset-editor.show-contents", "Show {{name}}", {
                  name: collection.name,
                })
          }
          aria-expanded={isOpen}
          aria-controls={panelId}
          disabled={!isIncluded}
          onClick={() => setIsExpanded((prev) => !prev)}
          css={{
            flex: "none",
            "& svg": {
              transitionProperty: "rotate",
              transitionDuration: "fast",
              transitionTimingFunction: "out",
            },
            "&[aria-expanded=true] svg": { rotate: "90deg" },
          }}
        >
          <Icon icon={CaretRightIcon} />
        </IconButton>
        <Checkbox
          label={collection.name}
          description={status}
          checked={isIncluded}
          disabled={isReplaced}
          onCheckedChange={(checked) =>
            toggleExcludedCollection(collection._id, !checked)
          }
          css={{ flex: "1 1 auto", minWidth: 0, paddingBlock: "1" }}
        />
      </HStack>
      <Collapse open={isOpen} id={panelId}>
        <Stack
          as="ul"
          gap="1"
          listStyle="none"
          margin="0"
          marginInlineStart="4"
          paddingBlock="1"
          paddingInlineStart="4"
          borderInlineStartWidth="1px"
          borderInlineStartStyle="dotted"
          borderColor="border.default"
        >
          {"collections" in collection &&
            Object.values(collection.collections).map((subCollection) => (
              <CollectionPlayset
                key={subCollection._id}
                {...props}
                collection={subCollection}
              />
            ))}
          {Object.values(collection.contents).map((item) => (
            <Box as="li" key={item._id}>
              <Checkbox
                label={item.name}
                checked={!excludedItems[item._id] && !replacedItems[item._id]}
                disabled={!!replacedItems[item._id]}
                onCheckedChange={(checked) =>
                  toggleExcludedItem(item._id, !checked)
                }
              />
            </Box>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}
