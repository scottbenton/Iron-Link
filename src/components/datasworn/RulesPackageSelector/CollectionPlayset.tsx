import { Datasworn } from "@datasworn/core";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Box,
  Checkbox,
  Collapse,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
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
        disablePadding
        secondaryAction={
          <Checkbox
            inputProps={{
              "aria-labelledby": collection._id,
            }}
            edge="end"
            checked={!isExcluded && !isReplaced}
            disabled={isReplaced}
            onChange={() => {
              toggleExcludedCollection(collection._id, !isExcluded);
            }}
          />
        }
      >
        <ListItemButton
          disabled={isExcluded || isReplaced}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <ListItemIcon>
            <ChevronRightIcon
              sx={(theme) => ({
                transform:
                  isExpanded && !(isExcluded || isReplaced)
                    ? "rotate(90deg)"
                    : "",
                transitionProperty: "transform",
                duration: theme.transitions.duration.shorter,
                transitionTimingFunction: theme.transitions.easing.easeInOut,
              })}
            />
          </ListItemIcon>
          <ListItemText
            id={collection._id}
            primary={collection.name}
            secondary={
              isReplaced
                ? t(
                    "playset-editor.replaced",
                    "This collection is replaced by another",
                  )
                : isExcluded
                  ? t("playset-editor.excluded", "This collection is excluded")
                  : undefined
            }
          />
        </ListItemButton>
      </ListItem>
      <Collapse in={isExpanded && !(isExcluded || isReplaced)} unmountOnExit>
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
      </Collapse>
    </>
  );
}
