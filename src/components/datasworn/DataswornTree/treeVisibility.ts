import {
  CollectionVisibility,
  ItemVisibility,
  VisibilitySettings,
} from "components/datasworn/_helpers/getCollectionVisibility";

// How much of a collection the filter shows. Everything shows while there is
// no filter, and inside a collection whose own name matched.
export function getCollectionVisibility(
  collectionId: string,
  search: string,
  isParentFullyVisible: boolean,
  visibilitySettings: VisibilitySettings,
): CollectionVisibility {
  if (!search || isParentFullyVisible) return CollectionVisibility.All;
  return (
    visibilitySettings.collectionVisibility[collectionId] ??
    CollectionVisibility.Hidden
  );
}

export function isItemVisible(
  itemId: string,
  collectionVisibility: CollectionVisibility,
  visibilitySettings: VisibilitySettings,
): boolean {
  if (collectionVisibility === CollectionVisibility.All) return true;
  if (collectionVisibility === CollectionVisibility.Hidden) return false;
  return visibilitySettings.itemVisibility[itemId] === ItemVisibility.Visible;
}
