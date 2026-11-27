import { Datasworn } from "@datasworn-community/core";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";
import { countVisibleItems } from "components/datasworn/_helpers/countVisibleItems";
import { CollectionVisibility } from "components/datasworn/_helpers/getCollectionVisibility";

import { MoveListItem } from "ui/game/MoveListItem";
import {
  CategoryHeadingLevel,
  ReferenceCategory,
} from "ui/game/ReferenceCategory";

import { getReferenceItemHref } from "../../data/referencePaths";
import { useReferenceTreeContext } from "./referenceTreeContext";
import { getMoveCountLabel } from "./referenceTreeCopy";
import {
  getCollectionVisibility,
  isItemVisible,
} from "./referenceTreeVisibility";
import { useCategoryOpenState } from "./useCategoryOpenState";

export interface ReferenceMoveCategoryProps {
  categoryId: string;
  categoryMap: Record<string, Datasworn.MoveCategory>;
  // Under a category whose name the filter matched, everything shows.
  isParentFullyVisible?: boolean;
  // A top-level category's heading level; nested ones follow their parent.
  headingLevel?: CategoryHeadingLevel;
}

// A move category in the reference's list: its moves are links to their
// pages, and its sub-categories nest inside it.
export function ReferenceMoveCategory(props: ReferenceMoveCategoryProps) {
  const {
    categoryId,
    categoryMap,
    isParentFullyVisible = false,
    headingLevel,
  } = props;
  const { t } = useTranslation();
  const { search, selectedId, visibilitySettings } = useReferenceTreeContext();
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
          <MoveListItem
            key={move._id}
            move={move}
            render={
              <LinkComponent href={getReferenceItemHref(move._id) ?? ""} />
            }
            current={selectedId === move._id}
          />
        ))}
      {Object.values(category.collections).map((subCategory) => (
        <ReferenceMoveCategory
          key={subCategory._id}
          categoryId={subCategory._id}
          categoryMap={categoryMap}
          isParentFullyVisible={isFullyVisible}
        />
      ))}
    </ReferenceCategory>
  );
}
