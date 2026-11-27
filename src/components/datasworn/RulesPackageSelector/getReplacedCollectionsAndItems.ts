import { Datasworn, IdParser, StringId } from "@datasworn-community/core";

export type PlaysetCollectionKey = "assets" | "moves" | "oracles";

/**
 * The collections and items that the packages' expansions replace, given
 * what is excluded: an excluded replacement replaces nothing, and an
 * excluded original is not shown as replaced.
 */
export function getReplacedCollectionsAndItems(
  tree: Record<string, Datasworn.RulesPackage>,
  type: PlaysetCollectionKey,
  excludedCollections: Record<string, boolean>,
  excludedItems: Record<string, boolean>,
): {
  replacedCollections: Record<string, boolean>;
  replacedItems: Record<string, boolean>;
} {
  const replacedCollections: Record<string, boolean> = {};
  const replacedItems: Record<string, boolean> = {};

  Object.values(tree).forEach((rulesPackage) => {
    if (rulesPackage.type === "expansion") {
      getReplacedCollectionsAndItemsFromCollection(
        tree,
        rulesPackage[type],
        excludedCollections,
        excludedItems,
        replacedCollections,
        replacedItems,
      );
    }
  });

  return {
    replacedCollections,
    replacedItems,
  };
}

function getReplacedCollectionsAndItemsFromCollection(
  tree: Record<string, Datasworn.RulesPackage>,
  collections: Record<
    string,
    | Datasworn.AssetCollection
    | Datasworn.MoveCategory
    | Datasworn.OracleCollection
  >,
  excludedCollections: Record<string, boolean>,
  excludedItems: Record<string, boolean>,
  replacedCollections: Record<string, boolean>,
  replacedItems: Record<string, boolean>,
) {
  Object.values(collections).forEach((collection) => {
    if (excludedCollections[collection._id]) return;

    if (collection.replaces) {
      collection.replaces.forEach((replacesKey) => {
        const collectionsToReplace = IdParser.getMatches(
          replacesKey as StringId.Primary,
          tree,
        );
        collectionsToReplace.forEach((collectionToReplace) => {
          if (
            collectionToReplace.type === collection.type &&
            !excludedCollections[collectionToReplace._id]
          ) {
            replacedCollections[collectionToReplace._id] = true;
          }
        });
      });
    } else {
      if ("collections" in collection) {
        getReplacedCollectionsAndItemsFromCollection(
          tree,
          collection.collections,
          excludedCollections,
          excludedItems,
          replacedCollections,
          replacedItems,
        );
      }
      Object.values(
        collection.contents as Record<
          string,
          Datasworn.Move | Datasworn.OracleRollable | Datasworn.Asset
        >,
      ).forEach((item) => {
        if (item.replaces && !excludedItems[item._id]) {
          item.replaces.forEach((replacesKey) => {
            const itemsToReplace = IdParser.getMatches(
              replacesKey as StringId.Primary,
              tree,
            );
            itemsToReplace.forEach((itemToReplace) => {
              if (
                !excludedItems[itemToReplace._id] &&
                itemToReplace.type === item.type
              ) {
                replacedItems[itemToReplace._id] = true;
              }
            });
          });
        }
      });
    }
  });
}
