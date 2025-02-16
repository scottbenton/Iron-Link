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

export function getCollectionVisibilities<
  T extends Datasworn.OracleCollection | Datasworn.MoveCategory,
>(
  searchValue: string,
  collectionIds: string[],
  collectionMap: Record<string, T>,
  itemMap: T["contents"],
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
  T extends Datasworn.OracleCollection | Datasworn.MoveCategory,
>(
  searchValue: string,
  collection: T,
  collectionMap: Record<string, T>,
  itemMap: T["contents"],
  collectionVisibilityMap: Record<string, CollectionVisibility>,
  itemVisibilityMap: Record<string, ItemVisibility>,
): boolean {
  console.debug(collection);
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
    const oracle = itemMap[_id];
    if (oracle) {
      if (
        oracle &&
        oracle.name
          .toLocaleLowerCase()
          .includes(searchValue.trim().toLocaleLowerCase())
      ) {
        collectionVisibility = CollectionVisibility.Some;
        itemVisibilityMap[oracle._id] = ItemVisibility.Visible;
      } else {
        itemVisibilityMap[oracle._id] = ItemVisibility.Hidden;
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
