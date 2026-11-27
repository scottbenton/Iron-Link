import { Datasworn } from "@datasworn-community/core";
import { useTranslation } from "react-i18next";

import { countVisibleItems } from "components/datasworn/_helpers/countVisibleItems";
import { CollectionVisibility } from "components/datasworn/_helpers/getCollectionVisibility";

import {
  CategoryHeadingLevel,
  ReferenceCategory,
} from "ui/game/ReferenceCategory";

import { ReferenceOracleRow } from "./ReferenceOracleRow";
import { useReferenceTreeContext } from "./referenceTreeContext";
import { getOracleCountLabel } from "./referenceTreeCopy";
import {
  getCollectionVisibility,
  isItemVisible,
} from "./referenceTreeVisibility";
import { isSharedTextCollection } from "./sharedTextCollections";
import { useCategoryOpenState } from "./useCategoryOpenState";

export interface ReferenceOracleCollectionProps {
  collectionId: string;
  collectionMap: Record<string, Datasworn.OracleCollection>;
  // Under a collection whose name the filter matched, everything shows.
  isParentFullyVisible?: boolean;
  // A top-level collection's heading level; nested ones follow their parent.
  headingLevel?: CategoryHeadingLevel;
}

// An oracle collection in the reference's list. A shared-text table is one
// row, listed before the collection's other sub-collections.
export function ReferenceOracleCollection(
  props: ReferenceOracleCollectionProps,
) {
  const {
    collectionId,
    collectionMap,
    isParentFullyVisible = false,
    headingLevel,
  } = props;
  const { t } = useTranslation();
  const { search, visibilitySettings } = useReferenceTreeContext();
  const [isOpen, setIsOpen] = useCategoryOpenState(collectionId);

  const collection = collectionMap[collectionId];
  const visibility = getCollectionVisibility(
    collectionId,
    search,
    isParentFullyVisible,
    visibilitySettings,
  );
  if (!collection || visibility === CollectionVisibility.Hidden) {
    return null;
  }

  if (isSharedTextCollection(collection)) {
    return <ReferenceOracleRow id={collection._id} name={collection.name} />;
  }

  const isFullyVisible = visibility === CollectionVisibility.All;
  const subCollections =
    collection.oracle_type === "tables"
      ? Object.values(collection.collections).sort(
          (a, b) =>
            Number(isSharedTextCollection(b)) -
            Number(isSharedTextCollection(a)),
        )
      : [];

  return (
    <ReferenceCategory
      title={collection.name}
      count={countVisibleItems(
        [collectionId],
        collectionMap,
        visibilitySettings,
        isFullyVisible,
      )}
      countLabel={getOracleCountLabel(t)}
      open={isOpen}
      onOpenChange={setIsOpen}
      headingLevel={headingLevel}
    >
      {Object.values(collection.contents ?? {})
        .filter((oracle) =>
          isItemVisible(oracle._id, visibility, visibilitySettings),
        )
        .map((oracle) => (
          <ReferenceOracleRow
            key={oracle._id}
            id={oracle._id}
            name={oracle.name}
            canRoll
          />
        ))}
      {subCollections.map((subCollection) => (
        <ReferenceOracleCollection
          key={subCollection._id}
          collectionId={subCollection._id}
          collectionMap={collectionMap}
          isParentFullyVisible={isFullyVisible}
        />
      ))}
    </ReferenceCategory>
  );
}
