import { ListItem } from "@/components/common/ListItem";
import { List } from "@/components/common/ListItem/List";
import { Checkbox } from "@/components/ui/checkbox";
import { Box, Collapsible, Icon } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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

export function CollectionPlayset(props: CollectionPlaysetProps) {
  const {
    collection,
    excludedCollections,
    toggleExcludedCollection,
    excludedItems,
    toggleExcludedItem,
    replacedCollections,
    replacedItems,
  } = props;

  const { t } = useTranslation();

  const isExcluded = !!excludedCollections[collection._id];
  const isReplaced = !!replacedCollections[collection._id];

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isExcluded || isReplaced) {
      setIsExpanded(false);
    }
  }, [isExcluded, isReplaced]);

  return (
    <>
      <ListItem
        id={collection._id}
        disabled={isExcluded || isReplaced}
        onClick={() => setIsExpanded((prev) => !prev)}
        label={collection.name}
        description={
          isReplaced
            ? t(
                "playset-editor.replaced",
                "This collection is replaced by another",
              )
            : isExcluded
              ? t("playset-editor.excluded", "This collection is excluded")
              : undefined
        }
        icon={
          <Icon
            size="sm"
            color="fg.muted"
            asChild
            transform={isExpanded ? "rotate(90deg)" : ""}
            transitionProperty="transform"
            transitionDuration="fast"
            transitionTimingFunction="easeInOut"
          >
            <ChevronRight />
          </Icon>
        }
        secondaryAction={
          <Checkbox
            inputProps={{ "aria-labelledby": collection._id }}
            checked={!isExcluded && !isReplaced}
            disabled={isReplaced}
            onCheckedChange={() => {
              toggleExcludedCollection(collection._id, !isExcluded);
            }}
          />
        }
      />
      <Collapsible.Root
        open={isExpanded && !(isExcluded || isReplaced)}
        unmountOnExit
      >
        <Collapsible.Content>
          <Box ml={7} borderColor={"border"} borderLeft={`1px dotted`}>
            {"collections" in collection && (
              <List>
                {Object.values(collection.collections).map((subCollection) => (
                  <CollectionPlayset
                    key={subCollection._id}
                    collection={subCollection}
                    excludedCollections={excludedCollections}
                    toggleExcludedCollection={toggleExcludedCollection}
                    excludedItems={excludedItems}
                    toggleExcludedItem={toggleExcludedItem}
                    replacedCollections={replacedCollections}
                    replacedItems={replacedItems}
                  />
                ))}
              </List>
            )}
            <List>
              {Object.values(collection.contents).map((item) => (
                <ListItem
                  key={item._id}
                  onClick={() => {
                    toggleExcludedItem(item._id, !excludedItems[item._id]);
                  }}
                  label={item.name}
                  secondaryAction={
                    <Checkbox
                      checked={
                        !excludedItems[item._id] && !replacedItems[item._id]
                      }
                      disabled={replacedItems[item._id]}
                      inputProps={{ "aria-labelledby": item._id }}
                      onCheckedChange={() => {
                        toggleExcludedItem(item._id, !excludedItems[item._id]);
                      }}
                    />
                  }
                />
              ))}
            </List>
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>
      {/* <Collapse in={isExpanded && !(isExcluded || isReplaced)} unmountOnExit>
        <Box ml={3.5} borderColor={"divider"} borderLeft={`1px dotted`}>
          {"collections" in collection && (
            <>
              {Object.values(collection.collections).map((subCollection) => (
                <CollectionPlayset
                  key={subCollection._id}
                  collection={subCollection}
                  excludedCollections={excludedCollections}
                  toggleExcludedCollection={toggleExcludedCollection}
                  excludedItems={excludedItems}
                  toggleExcludedItem={toggleExcludedItem}
                  replacedCollections={replacedCollections}
                  replacedItems={replacedItems}
                />
              ))}
            </>
          )}
          {Object.values(collection.contents).map((item) => (
            <ListItem key={item._id} disablePadding>
              <ListItemButton
                role={undefined}
                onClick={() => {
                  toggleExcludedItem(item._id, !excludedItems[item._id]);
                }}
              >
                <ListItemText id={item._id}>{item.name}</ListItemText>

                <Checkbox
                  edge="end"
                  disableRipple
                  checked={!excludedItems[item._id] && !replacedItems[item._id]}
                  disabled={replacedItems[item._id]}
                  inputProps={{ "aria-labelledby": item._id }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </Box>
      </Collapse> */}
    </>
  );
}
