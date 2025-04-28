import { Datasworn } from "@datasworn/core";

export enum CollectionVisibility {
  All,
  Some,
  Hidden,
}
export enum ItemVisibility {
  Visible,
  Hidden,
}

export interface VisibilitySettings {
  collectionVisibility: Record<string, CollectionVisibility>;
  itemVisibility: Record<string, ItemVisibility>;
}

// Define a mapping type that links Collection types to their corresponding Item types
type CollectionItemMap = {
  [K in Datasworn.OracleCollection["type"]]: Datasworn.AnyOracleRollable;
} & {
  [K in Datasworn.MoveCategory["type"]]: Datasworn.AnyMove;
};

export function getCollectionVisibilities<
  Collection extends Datasworn.OracleCollection | Datasworn.MoveCategory,
  Item extends CollectionItemMap[Collection["type"]],
>(
  searchValue: string,
  collectionIds: string[],
  collectionMap: Record<string, Collection>,
  itemMap: Record<string, Item>,
  collectionVisibilityMap: Record<string, CollectionVisibility>,
  itemVisibilityMap: Record<string, ItemVisibility>,
): void {
  collectionIds.forEach((collectionId) => {
    const collection = collectionMap[collectionId];
    if (collection) {
      getCollectionVisibility(
        searchValue,
        collection,
        collectionMap,
        itemMap,
        collectionVisibilityMap,
        itemVisibilityMap,
      );
    }
  });
}

export function getCollectionVisibility<
  Collection extends Datasworn.OracleCollection | Datasworn.MoveCategory,
  Item extends CollectionItemMap[Collection["type"]],
>(
  searchValue: string,
  collection: Collection,
  collectionMap: Record<string, Collection>,
  itemMap: Record<string, Item>,
  collectionVisibilityMap: Record<string, CollectionVisibility>,
  itemVisibilityMap: Record<string, ItemVisibility>,
): boolean {
  if (!searchValue.trim()) {
    collectionVisibilityMap[collection._id] = CollectionVisibility.All;
    return true;
  }

  if (
    collection.name
      .toLocaleLowerCase()
      .includes(searchValue.trim().toLocaleLowerCase())
  ) {
    collectionVisibilityMap[collection._id] = CollectionVisibility.All;
    return true;
  }

  let collectionVisibility = CollectionVisibility.Hidden;
  Object.values(collection.contents).forEach(({ _id }) => {
    const item = itemMap[_id];
    if (item) {
      if (
        item &&
        item.name
          .toLocaleLowerCase()
          .includes(searchValue.trim().toLocaleLowerCase())
      ) {
        collectionVisibility = CollectionVisibility.Some;
        itemVisibilityMap[item._id] = ItemVisibility.Visible;
      } else {
        itemVisibilityMap[item._id] = ItemVisibility.Hidden;
      }
    }
  });

  if ("collections" in collection) {
    Object.values(collection.collections).forEach((subCollection) => {
      const areSubCollectionsVisible = getCollectionVisibility(
        searchValue,
        subCollection,
        collectionMap,
        itemMap,
        collectionVisibilityMap,
        itemVisibilityMap,
      );
      if (areSubCollectionsVisible) {
        collectionVisibility = CollectionVisibility.Some;
      }
    });
  }

  collectionVisibilityMap[collection._id] = collectionVisibility;

  return collectionVisibility !== CollectionVisibility.Hidden;
}
