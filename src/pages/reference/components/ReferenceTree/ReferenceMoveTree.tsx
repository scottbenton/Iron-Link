import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { countVisibleItems } from "components/datasworn/_helpers/countVisibleItems";
import {
  CollectionVisibility,
  ItemVisibility,
  VisibilitySettings,
  getCollectionVisibilities,
} from "components/datasworn/_helpers/getCollectionVisibility";

import { SearchField } from "ui/components/SearchField";
import { Text } from "ui/components/Text";
import { Stack } from "ui/primitives";

import { useAnnounceSearchResults } from "hooks/useAnnounceSearchResults";

import { useMoves } from "stores/dataswornTree.store";

import { ReferenceMoveCategory } from "./ReferenceMoveCategory";
import { ReferenceTreeGroup } from "./ReferenceTreeGroup";
import {
  ReferenceTreeContext,
  ReferenceTreeContextValue,
} from "./referenceTreeContext";
import { ReferenceTreeOptions, useReferenceTree } from "./useReferenceTree";

export type ReferenceMoveTreeProps = ReferenceTreeOptions;

// The reference's list of moves: a filter, then each rules package's
// categories, every move a link to its page.
export function ReferenceMoveTree(props: ReferenceMoveTreeProps) {
  const { selectedId } = props;
  const { t } = useTranslation();

  const [searchValue, setSearchValue] = useState("");
  const search = useDeferredValue(searchValue).trim();

  const moves = useMoves();
  const { moveMap } = moves;
  const {
    rootCollections: rootMoveCategories,
    collectionMap: moveCategoryMap,
    openCollectionIds,
  } = useReferenceTree(moves.rootMoveCategories, moves.moveCategoryMap, props);

  const rootCategoryIds = useMemo(
    () =>
      Object.values(rootMoveCategories).flatMap(
        ({ rootCollectionIds }) => rootCollectionIds,
      ),
    [rootMoveCategories],
  );

  const visibilitySettings = useMemo<VisibilitySettings>(() => {
    const collectionVisibility: Record<string, CollectionVisibility> = {};
    const itemVisibility: Record<string, ItemVisibility> = {};
    getCollectionVisibilities(
      search,
      rootCategoryIds,
      moveCategoryMap,
      moveMap,
      collectionVisibility,
      itemVisibility,
    );
    return { collectionVisibility, itemVisibility };
  }, [search, rootCategoryIds, moveCategoryMap, moveMap]);

  const resultCount = useMemo(
    () =>
      countVisibleItems(
        rootCategoryIds,
        moveCategoryMap,
        visibilitySettings,
        !search,
      ),
    [rootCategoryIds, moveCategoryMap, visibilitySettings, search],
  );
  const noResults = t("datasworn.filter-moves-no-results", "No moves found");
  useAnnounceSearchResults(
    search,
    resultCount === 0
      ? noResults
      : t("datasworn.filter-moves-results", "{{count}} moves found", {
          count: resultCount,
          defaultValue_one: "1 move found",
        }),
  );

  const contextValue = useMemo<ReferenceTreeContextValue>(
    () => ({ selectedId, openCollectionIds, visibilitySettings, search }),
    [selectedId, openCollectionIds, visibilitySettings, search],
  );

  const groups = Object.entries(rootMoveCategories);
  const showGroupTitles = groups.length > 1;

  return (
    <ReferenceTreeContext.Provider value={contextValue}>
      <Stack gap="3">
        <SearchField
          label={t("datasworn.filter-moves", "Filter Moves")}
          placeholder={t("datasworn.filter-moves", "Filter Moves")}
          value={searchValue}
          onValueChange={setSearchValue}
        />
        {groups.map(([packageId, ruleset]) => (
          <ReferenceTreeGroup
            key={packageId}
            title={showGroupTitles ? ruleset.title : undefined}
          >
            {ruleset.rootCollectionIds.map((categoryId) => (
              <ReferenceMoveCategory
                key={categoryId}
                categoryId={categoryId}
                categoryMap={moveCategoryMap}
                headingLevel={showGroupTitles ? 4 : 3}
              />
            ))}
          </ReferenceTreeGroup>
        ))}
        {search && resultCount === 0 && (
          <Text color="muted" variant="bodySm" css={{ paddingInline: "3" }}>
            {noResults}
          </Text>
        )}
      </Stack>
    </ReferenceTreeContext.Provider>
  );
}
