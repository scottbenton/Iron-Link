import {
  CollectionVisibility,
  ItemVisibility,
  VisibilitySettings,
} from "./getCollectionVisibility";

// The parts of a move category or oracle collection the trees list.
export interface CountableCollection {
  _id: string;
  oracle_type?: string;
  contents?: Record<string, { _id: string }>;
  collections?: Record<string, CountableCollection>;
}

const SHARED_TEXT_TYPES = [
  "table_shared_text",
  "table_shared_text2",
  "table_shared_text3",
];

/**
 * How many moves or oracles a filtered tree shows, counted the way the tree
 * lists them: a collection whose name matches shows everything in it, and a
 * shared-text table is one row.
 */
export function countVisibleItems(
  collectionIds: string[],
  collectionMap: Record<string, CountableCollection>,
  visibilitySettings: VisibilitySettings,
): number {
  const count = (
    collection: CountableCollection,
    isFullyVisible: boolean,
  ): number => {
    const visibility = isFullyVisible
      ? CollectionVisibility.All
      : (visibilitySettings.collectionVisibility[collection._id] ??
        CollectionVisibility.Hidden);
    if (visibility === CollectionVisibility.Hidden) {
      return 0;
    }
    if (SHARED_TEXT_TYPES.includes(collection.oracle_type ?? "")) {
      return 1;
    }
    const isAll = visibility === CollectionVisibility.All;
    let total = Object.values(collection.contents ?? {}).filter(
      ({ _id }) =>
        isAll ||
        visibilitySettings.itemVisibility[_id] === ItemVisibility.Visible,
    ).length;
    Object.values(collection.collections ?? {}).forEach((subCollection) => {
      total += count(collectionMap[subCollection._id] ?? subCollection, isAll);
    });
    return total;
  };

  return collectionIds.reduce((total, collectionId) => {
    const collection = collectionMap[collectionId];
    return collection ? total + count(collection, false) : total;
  }, 0);
}
