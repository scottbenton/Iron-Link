import { Datasworn } from "@datasworn-community/core";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { countVisibleItems } from "components/datasworn/_helpers/countVisibleItems";
import { CollectionVisibility } from "components/datasworn/_helpers/getCollectionVisibility";

import {
  CategoryHeadingLevel,
  ReferenceCategory,
} from "ui/game/ReferenceCategory";

import {
  RenderOracleRow,
  useDataswornTreeContext,
} from "./dataswornTreeContext";
import { getOracleCountLabel } from "./dataswornTreeCopy";
import { isSharedTextCollection } from "./sharedTextCollections";
import { getCollectionVisibility, isItemVisible } from "./treeVisibility";
import { useCategoryOpenState } from "./useCategoryOpenState";

export interface DataswornOracleCollectionProps {
  collectionId: string;
  collectionMap: Record<string, Datasworn.OracleCollection>;
  renderOracle: RenderOracleRow;
  // Under a collection whose name the filter matched, everything shows.
  isParentFullyVisible?: boolean;
  // A top-level collection's heading level; nested ones follow their parent.
  headingLevel?: CategoryHeadingLevel;
}

// An oracle collection in a list of oracles, each oracle drawn by
// `renderOracle`. A shared-text table is one row, listed before the
// collection's other sub-collections.
export function DataswornOracleCollection(
  props: DataswornOracleCollectionProps,
) {
  const {
    collectionId,
    collectionMap,
    renderOracle,
    isParentFullyVisible = false,
    headingLevel,
  } = props;
  const { t } = useTranslation();
  const { search, selectedId, visibilitySettings } = useDataswornTreeContext();
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
    return renderOracle(
      { id: collection._id, name: collection.name, canRoll: false },
      { current: selectedId === collection._id },
    );
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
          <Fragment key={oracle._id}>
            {renderOracle(
              { id: oracle._id, name: oracle.name, canRoll: true },
              { current: selectedId === oracle._id },
            )}
          </Fragment>
        ))}
      {subCollections.map((subCollection) => (
        <DataswornOracleCollection
          key={subCollection._id}
          collectionId={subCollection._id}
          collectionMap={collectionMap}
          renderOracle={renderOracle}
          isParentFullyVisible={isFullyVisible}
        />
      ))}
    </ReferenceCategory>
  );
}
