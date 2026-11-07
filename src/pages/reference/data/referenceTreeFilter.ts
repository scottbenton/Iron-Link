// Which collections and items a reference list shows for a search and the
// tab's Sources filter. Works on any Datasworn collection shape: moves,
// oracles and assets all have `contents`, and those that nest have
// `collections`.

export interface ReferenceTreeCollection {
  _id: string;
  name: string;
  contents?: Record<string, { _id: string; name: string }>;
  collections?: Record<string, ReferenceTreeCollection>;
  oracle_type?: string;
}

export interface ReferenceTreeVisibility {
  collections: Set<string>;
  items: Set<string>;
}

// Oracle collections whose tables share one result column read as one item.
export function isLeafCollection(collection: ReferenceTreeCollection) {
  return (
    collection.oracle_type === "table_shared_text" ||
    collection.oracle_type === "table_shared_text2" ||
    collection.oracle_type === "table_shared_text3"
  );
}

export function getReferenceTreeVisibility(
  rootCollectionIds: string[],
  collectionMap: Record<string, ReferenceTreeCollection>,
  searchValue: string,
  isSourceVisible: (id: string) => boolean,
): ReferenceTreeVisibility {
  const search = searchValue.trim().toLocaleLowerCase();
  const visibility: ReferenceTreeVisibility = {
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
  collectionMap: Record<string, ReferenceTreeCollection>,
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
