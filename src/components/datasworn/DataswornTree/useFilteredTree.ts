import { useMemo } from "react";

import {
  DataswornTreeCollection,
  filterDataswornTree,
  getAncestorCollectionIds,
} from "components/datasworn/_helpers/dataswornTreeFilter";

interface RootCollections {
  title: string;
  rootCollectionIds: string[];
}

export interface DataswornTreeOptions {
  // Hides items and collections, such as sources turned off. Without it,
  // everything shows.
  isVisible?: (id: string) => boolean;
  // Package ids in the order their groups should show. Packages it leaves
  // out follow, in their stored order.
  packageOrder?: string[];
  // The item open beside the list; the collections around it start open.
  selectedId?: string;
}

const showEverything = () => true;
const noOrder: string[] = [];

// The tree a list shows: filtered, its groups in order, and the collections
// around the open item noted so they start open.
export function useFilteredTree<
  Root extends RootCollections,
  Collection extends DataswornTreeCollection,
>(
  rootCollections: Record<string, Root>,
  collectionMap: Record<string, Collection>,
  options: DataswornTreeOptions,
): {
  rootCollections: Record<string, Root>;
  collectionMap: Record<string, Collection>;
  openCollectionIds: Set<string>;
} {
  const {
    isVisible = showEverything,
    packageOrder = noOrder,
    selectedId,
  } = options;

  const filtered = useMemo(() => {
    const order = (id: string) => {
      const index = packageOrder.indexOf(id);
      return index < 0 ? Number.MAX_SAFE_INTEGER : index;
    };
    const sortedRoots = Object.entries(rootCollections).sort(
      ([a], [b]) => order(a) - order(b),
    );
    const nextMap = filterDataswornTree(
      sortedRoots.flatMap(([, root]) => root.rootCollectionIds),
      collectionMap,
      isVisible,
    ).collectionMap;
    const nextRoots: Record<string, Root> = {};
    sortedRoots.forEach(([id, root]) => {
      const rootCollectionIds = root.rootCollectionIds.filter(
        (collectionId) => !!nextMap[collectionId],
      );
      if (rootCollectionIds.length > 0) {
        nextRoots[id] = { ...root, rootCollectionIds };
      }
    });
    return { rootCollections: nextRoots, collectionMap: nextMap };
  }, [rootCollections, collectionMap, isVisible, packageOrder]);

  const openCollectionIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const allRootIds = Object.values(filtered.rootCollections).flatMap(
      (root) => root.rootCollectionIds,
    );
    return new Set(
      getAncestorCollectionIds(allRootIds, filtered.collectionMap, selectedId),
    );
  }, [filtered, selectedId]);

  return { ...filtered, openCollectionIds };
}
