import { Datasworn } from "@datasworn-community/core";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { countVisibleItems } from "components/datasworn/_helpers/countVisibleItems";
import { CollectionVisibility } from "components/datasworn/_helpers/getCollectionVisibility";

import {
  CategoryHeadingLevel,
  ReferenceCategory,
} from "ui/game/ReferenceCategory";

import { RenderMoveRow, useDataswornTreeContext } from "./dataswornTreeContext";
import { getMoveCountLabel } from "./dataswornTreeCopy";
import { getCollectionVisibility, isItemVisible } from "./treeVisibility";
import { useCategoryOpenState } from "./useCategoryOpenState";

export interface DataswornMoveCategoryProps {
  categoryId: string;
  categoryMap: Record<string, Datasworn.MoveCategory>;
  renderMove: RenderMoveRow;
  // Under a category whose name the filter matched, everything shows.
  isParentFullyVisible?: boolean;
  // A top-level category's heading level; nested ones follow their parent.
  headingLevel?: CategoryHeadingLevel;
}

// A move category in a list of moves: its moves, each drawn by `renderMove`,
// then its sub-categories nested inside it.
export function DataswornMoveCategory(props: DataswornMoveCategoryProps) {
  const {
    categoryId,
    categoryMap,
    renderMove,
    isParentFullyVisible = false,
    headingLevel,
  } = props;
  const { t } = useTranslation();
  const { search, selectedId, visibilitySettings } = useDataswornTreeContext();
  const [isOpen, setIsOpen] = useCategoryOpenState(categoryId);

  const category = categoryMap[categoryId];
  const visibility = getCollectionVisibility(
    categoryId,
    search,
    isParentFullyVisible,
    visibilitySettings,
  );
  if (!category || visibility === CollectionVisibility.Hidden) {
    return null;
  }
  const isFullyVisible = visibility === CollectionVisibility.All;

  return (
    <ReferenceCategory
      title={category.name}
      count={countVisibleItems(
        [categoryId],
        categoryMap,
        visibilitySettings,
        isFullyVisible,
      )}
      countLabel={getMoveCountLabel(t)}
      open={isOpen}
      onOpenChange={setIsOpen}
      headingLevel={headingLevel}
    >
      {Object.values(category.contents)
        .filter((move) =>
          isItemVisible(move._id, visibility, visibilitySettings),
        )
        .map((move) => (
          <Fragment key={move._id}>
            {renderMove(move, { current: selectedId === move._id })}
          </Fragment>
        ))}
      {Object.values(category.collections).map((subCategory) => (
        <DataswornMoveCategory
          key={subCategory._id}
          categoryId={subCategory._id}
          categoryMap={categoryMap}
          renderMove={renderMove}
          isParentFullyVisible={isFullyVisible}
        />
      ))}
    </ReferenceCategory>
  );
}
