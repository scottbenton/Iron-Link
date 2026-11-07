import { ListItemButtonProps } from "@mui/material";
import { createContext, useContext, useMemo } from "react";

import { LinkComponent } from "components/LinkComponent";

import {
  DataswornTreeCollection,
  filterDataswornTree,
  getAncestorCollectionIds,
} from "./dataswornTreeFilter";

// Turns a move or oracle list into a list of links, as the reference uses it:
// each item opens its own page instead of expanding in place or rolling.
export interface TreeLinkMode {
  getHref: (id: string) => string | undefined;
  // The item open beside the list. Its row is marked and its collections open.
  selectedId?: string;
  // Hides items and collections, such as sources turned off.
  isVisible?: (id: string) => boolean;
  // Package ids in the order their groups should show.
  packageOrder?: string[];
  // A control at the end of an item's row, like an oracle's quick roll.
  renderItemAction?: (item: { _id: string; name: string }) => React.ReactNode;
}

export interface TreeLinkModeContextValue extends TreeLinkMode {
  openCollectionIds: Set<string>;
}

export const TreeLinkModeContext = createContext<
  TreeLinkModeContextValue | undefined
>(undefined);

export function useTreeLinkMode() {
  return useContext(TreeLinkModeContext);
}

interface RootCollections {
  title: string;
  rootCollectionIds: string[];
}

// The tree a list shows in link mode: filtered, its groups ordered, and the
// collections around the selected item noted so they start open.
export function useLinkModeTree<
  Root extends RootCollections,
  Collection extends DataswornTreeCollection,
>(
  linkMode: TreeLinkMode | undefined,
  rootCollections: Record<string, Root>,
  collectionMap: Record<string, Collection>,
): {
  rootCollections: Record<string, Root>;
  collectionMap: Record<string, Collection>;
  contextValue: TreeLinkModeContextValue | undefined;
} {
  const isVisible = linkMode?.isVisible;
  const packageOrder = linkMode?.packageOrder;
  const selectedId = linkMode?.selectedId;

  const filtered = useMemo(() => {
    if (!isVisible && !packageOrder) {
      return { rootCollections, collectionMap };
    }
    const order = (id: string) => {
      const index = packageOrder?.indexOf(id) ?? -1;
      return index < 0 ? Number.MAX_SAFE_INTEGER : index;
    };
    const sortedRoots = Object.entries(rootCollections).sort(
      ([a], [b]) => order(a) - order(b),
    );
    const nextMap = isVisible
      ? filterDataswornTree(
          sortedRoots.flatMap(([, root]) => root.rootCollectionIds),
          collectionMap,
          isVisible,
        ).collectionMap
      : collectionMap;
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

  const contextValue = useMemo(
    () => (linkMode ? { ...linkMode, openCollectionIds } : undefined),
    [linkMode, openCollectionIds],
  );

  return { ...filtered, contextValue };
}

// A row that is a link to the item's page. ListItemButton's own props don't
// carry a link component's href.
export function linkButtonProps(
  href: string | undefined,
  isSelected: boolean,
): ListItemButtonProps {
  return {
    component: LinkComponent,
    href: href ?? "",
    selected: isSelected,
    "aria-current": isSelected ? "page" : undefined,
  } as unknown as ListItemButtonProps;
}
