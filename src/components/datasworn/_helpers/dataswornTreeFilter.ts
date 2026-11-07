// Which collections and items a move or oracle list shows for a search and a
// filter such as the reference's Sources. Works on any Datasworn collection
// shape: moves, oracles and assets all have `contents`, and those that nest
// have `collections`.

export interface DataswornTreeCollection {
  _id: string;
  name: string;
  contents?: Record<string, { _id: string; name: string }>;
  collections?: Record<string, DataswornTreeCollection>;
  oracle_type?: string;
}

export interface DataswornTreeVisibility {
  collections: Set<string>;
  items: Set<string>;
}

// Oracle collections whose tables share one result column read as one item.
export function isLeafCollection(collection: DataswornTreeCollection) {
  return (
    collection.oracle_type === "table_shared_text" ||
    collection.oracle_type === "table_shared_text2" ||
    collection.oracle_type === "table_shared_text3"
  );
}

export function getDataswornTreeVisibility(
  rootCollectionIds: string[],
  collectionMap: Record<string, DataswornTreeCollection>,
  searchValue: string,
  isSourceVisible: (id: string) => boolean,
): DataswornTreeVisibility {
  const search = searchValue.trim().toLocaleLowerCase();
  const visibility: DataswornTreeVisibility = {
    collections: new Set(),
    items: new Set(),
  };

  const matches = (name: string) =>
    !search || name.toLocaleLowerCase().includes(search);

  const visit = (
    collectionId: string,
    ancestorMatched: boolean,
    seen: Set<string>,
  ): boolean => {
    if (seen.has(collectionId)) return false;
    seen.add(collectionId);

    const collection = collectionMap[collectionId];
    if (!collection) return false;

    const matched = ancestorMatched || matches(collection.name);

    if (isLeafCollection(collection)) {
      const isVisible = matched && isSourceVisible(collection._id);
      if (isVisible) visibility.collections.add(collection._id);
      return isVisible;
    }

    let hasVisibleChild = false;
    Object.values(collection.contents ?? {}).forEach((item) => {
      if (isSourceVisible(item._id) && (matched || matches(item.name))) {
        visibility.items.add(item._id);
        hasVisibleChild = true;
      }
    });
    Object.values(collection.collections ?? {}).forEach((subCollection) => {
      if (visit(subCollection._id, matched, seen)) {
        hasVisibleChild = true;
      }
    });

    if (hasVisibleChild) visibility.collections.add(collection._id);
    return hasVisibleChild;
  };

  rootCollectionIds.forEach((rootId) => visit(rootId, false, new Set()));

  return visibility;
}

// The collection ids leading to an item, root first, so the list can open
// them when an item is selected.
export function getAncestorCollectionIds(
  rootCollectionIds: string[],
  collectionMap: Record<string, DataswornTreeCollection>,
  targetId: string,
): string[] {
  const path: string[] = [];

  const visit = (collectionId: string, seen: Set<string>): boolean => {
    if (seen.has(collectionId)) return false;
    seen.add(collectionId);
    const collection = collectionMap[collectionId];
    if (!collection) return false;
    if (collection._id === targetId) return true;
    path.push(collection._id);
    if (
      Object.values(collection.contents ?? {}).some(
        (item) => item._id === targetId,
      )
    ) {
      return true;
    }
    for (const subCollection of Object.values(collection.collections ?? {})) {
      if (visit(subCollection._id, seen)) return true;
    }
    path.pop();
    return false;
  };

  for (const rootId of rootCollectionIds) {
    if (visit(rootId, new Set())) return [...path];
  }
  return [];
}

// A copy of a tree holding only what passes `isVisible`, so a list can show a
// filtered tree with its usual code. Collections left empty are dropped.
export function filterDataswornTree<Collection extends DataswornTreeCollection>(
  rootCollectionIds: string[],
  collectionMap: Record<string, Collection>,
  isVisible: (id: string) => boolean,
): {
  rootCollectionIds: string[];
  collectionMap: Record<string, Collection>;
} {
  const visibility = getDataswornTreeVisibility(
    rootCollectionIds,
    collectionMap,
    "",
    isVisible,
  );

  const filteredMap: Record<string, Collection> = {};
  Object.entries(collectionMap).forEach(([id, collection]) => {
    if (!visibility.collections.has(id)) return;
    if (isLeafCollection(collection)) {
      filteredMap[id] = collection;
      return;
    }
    filteredMap[id] = {
      ...collection,
      contents: collection.contents
        ? Object.fromEntries(
            Object.entries(collection.contents).filter(([, item]) =>
              visibility.items.has(item._id),
            ),
          )
        : collection.contents,
      collections: collection.collections
        ? Object.fromEntries(
            Object.entries(collection.collections).filter(([, sub]) =>
              visibility.collections.has(sub._id),
            ),
          )
        : collection.collections,
    };
  });

  return {
    rootCollectionIds: rootCollectionIds.filter((id) =>
      visibility.collections.has(id),
    ),
    collectionMap: filteredMap,
  };
}
