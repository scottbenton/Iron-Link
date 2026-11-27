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

import { useOracles } from "stores/dataswornTree.store";

import { ReferenceAskTheOracle } from "./ReferenceAskTheOracle";
import { ReferenceOracleCollection } from "./ReferenceOracleCollection";
import { ReferenceTreeGroup } from "./ReferenceTreeGroup";
import {
  ReferenceTreeContext,
  ReferenceTreeContextValue,
} from "./referenceTreeContext";
import { ReferenceTreeOptions, useReferenceTree } from "./useReferenceTree";

export interface ReferenceOracleTreeProps extends ReferenceTreeOptions {
  // Rolls an oracle from its row or the Ask the Oracle buttons.
  rollOracle: (oracleId: string) => void;
}

// The reference's list of oracles: Ask the Oracle, a filter, then each rules
// package's collections, every oracle a link to its page with a quick roll.
export function ReferenceOracleTree(props: ReferenceOracleTreeProps) {
  const { selectedId, rollOracle } = props;
  const { t } = useTranslation();

  const [searchValue, setSearchValue] = useState("");
  const search = useDeferredValue(searchValue).trim();

  const oracles = useOracles();
  const { oracleRollableMap } = oracles;
  const {
    rootCollections: rootOracleCollections,
    collectionMap: oracleCollectionMap,
    openCollectionIds,
  } = useReferenceTree(
    oracles.rootOracleCollections,
    oracles.oracleCollectionMap,
    props,
  );

  const rootCollectionIds = useMemo(
    () =>
      Object.values(rootOracleCollections).flatMap(
        ({ rootCollectionIds }) => rootCollectionIds,
      ),
    [rootOracleCollections],
  );

  const visibilitySettings = useMemo<VisibilitySettings>(() => {
    const collectionVisibility: Record<string, CollectionVisibility> = {};
    const itemVisibility: Record<string, ItemVisibility> = {};
    getCollectionVisibilities(
      search,
      rootCollectionIds,
      oracleCollectionMap,
      oracleRollableMap,
      collectionVisibility,
      itemVisibility,
    );
    return { collectionVisibility, itemVisibility };
  }, [search, rootCollectionIds, oracleCollectionMap, oracleRollableMap]);

  const resultCount = useMemo(
    () =>
      countVisibleItems(
        rootCollectionIds,
        oracleCollectionMap,
        visibilitySettings,
        !search,
      ),
    [rootCollectionIds, oracleCollectionMap, visibilitySettings, search],
  );
  const noResults = t(
    "datasworn.filter-oracles-no-results",
    "No oracles found",
  );
  useAnnounceSearchResults(
    search,
    resultCount === 0
      ? noResults
      : t("datasworn.filter-oracles-results", "{{count}} oracles found", {
          count: resultCount,
          defaultValue_one: "1 oracle found",
        }),
  );

  const contextValue = useMemo<ReferenceTreeContextValue>(
    () => ({
      selectedId,
      openCollectionIds,
      visibilitySettings,
      search,
      rollOracle,
    }),
    [selectedId, openCollectionIds, visibilitySettings, search, rollOracle],
  );

  const groups = Object.entries(rootOracleCollections);
  const showGroupTitles = groups.length > 1;

  return (
    <ReferenceTreeContext.Provider value={contextValue}>
      <Stack gap="3">
        <ReferenceAskTheOracle rollOracle={rollOracle} />
        <SearchField
          label={t("datasworn.filter-oracles", "Filter Oracles")}
          placeholder={t("datasworn.filter-oracles", "Filter Oracles")}
          value={searchValue}
          onValueChange={setSearchValue}
        />
        {groups.map(([packageId, ruleset]) => (
          <ReferenceTreeGroup
            key={packageId}
            title={showGroupTitles ? ruleset.title : undefined}
          >
            {ruleset.rootCollectionIds.map((collectionId) => (
              <ReferenceOracleCollection
                key={collectionId}
                collectionId={collectionId}
                collectionMap={oracleCollectionMap}
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
