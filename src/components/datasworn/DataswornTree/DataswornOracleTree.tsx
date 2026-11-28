import { Datasworn } from "@datasworn-community/core";
import { useDeferredValue, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { countVisibleItems } from "components/datasworn/_helpers/countVisibleItems";
import {
  CollectionVisibility,
  ItemVisibility,
  VisibilitySettings,
  getCollectionVisibilities,
} from "components/datasworn/_helpers/getCollectionVisibility";

import { useHeadingComponent } from "ui/components/HeadingOffset";
import { SearchField } from "ui/components/SearchField";
import { Text } from "ui/components/Text";
import { Stack } from "ui/primitives";

import { useAnnounceSearchResults } from "hooks/useAnnounceSearchResults";

import { useOracles } from "stores/dataswornTree.store";

import { AskTheOracleButtons } from "./AskTheOracleButtons";
import { DataswornOracleCollection } from "./DataswornOracleCollection";
import { DataswornTreeGroup } from "./DataswornTreeGroup";
import {
  DataswornTreeContext,
  DataswornTreeContextValue,
  RenderOracleRow,
} from "./dataswornTreeContext";
import { DataswornTreeOptions, useFilteredTree } from "./useFilteredTree";

export interface DataswornFeaturedOracle {
  oracleId: string;
  // Read under the oracle's name, such as the fields that roll it.
  description?: string;
}

export interface DataswornOracleTreeProps extends DataswornTreeOptions {
  // Oracles listed first under their own heading, above the rules packages.
  // The filter narrows them by name; ones not in the rules are left out.
  featured?: {
    title: string;
    oracles: DataswornFeaturedOracle[];
  };
  // Draws one oracle's row, such as a link to its page with a quick roll.
  renderOracle: RenderOracleRow;
  // Rolls an oracle from the Ask the Oracle buttons, which show only with it.
  rollOracle?: (oracleId: string) => void;
}

// A list of oracles: Ask the Oracle, a filter, then each rules package's
// collections, with their counts, open state and filter matches. The caller
// draws the rows.
export function DataswornOracleTree(props: DataswornOracleTreeProps) {
  const { selectedId, renderOracle, rollOracle, featured } = props;
  const { t } = useTranslation();

  const [searchValue, setSearchValue] = useState("");
  const search = useDeferredValue(searchValue).trim();

  const oracles = useOracles();
  const { oracleRollableMap } = oracles;
  const {
    rootCollections: rootOracleCollections,
    collectionMap: oracleCollectionMap,
    openCollectionIds,
  } = useFilteredTree(
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

  const featuredOracles = useMemo(() => {
    const term = search.toLowerCase();
    return (featured?.oracles ?? []).flatMap(({ oracleId, description }) => {
      // Only an oracle in the rules can roll; one the rules leave out is not
      // offered here.
      const oracle = oracleRollableMap[oracleId] as
        | Datasworn.OracleRollable
        | undefined;
      if (!oracle) return [];
      if (term && !oracle.name.toLowerCase().includes(term)) return [];
      return [
        {
          id: oracle._id,
          name: oracle.name,
          canRoll: true,
          // A description that only repeats the name is left out.
          description:
            description?.toLowerCase() === oracle.name.toLowerCase()
              ? undefined
              : description,
        },
      ];
    });
  }, [featured, oracleRollableMap, search]);
  const featuredHeadingId = useId();
  const FeaturedHeading = useHeadingComponent(3);

  const contextValue = useMemo<DataswornTreeContextValue>(
    () => ({ selectedId, openCollectionIds, visibilitySettings, search }),
    [selectedId, openCollectionIds, visibilitySettings, search],
  );

  const groups = Object.entries(rootOracleCollections);
  const showGroupTitles = groups.length > 1 || featuredOracles.length > 0;

  return (
    <DataswornTreeContext.Provider value={contextValue}>
      <Stack gap="3">
        {rollOracle && <AskTheOracleButtons rollOracle={rollOracle} />}
        <SearchField
          label={t("datasworn.filter-oracles", "Filter Oracles")}
          placeholder={t("datasworn.filter-oracles", "Filter Oracles")}
          value={searchValue}
          onValueChange={setSearchValue}
        />
        {featured && featuredOracles.length > 0 && (
          <Stack gap="1">
            <Text
              id={featuredHeadingId}
              variant="eyebrow"
              color="muted"
              as={FeaturedHeading}
              css={{ paddingInline: "3", paddingBlockStart: "2" }}
            >
              {featured.title}
            </Text>
            <Stack
              as="ul"
              gap="0"
              aria-labelledby={featuredHeadingId}
              listStyle="none"
              margin="0"
              padding="0"
            >
              {featuredOracles.map((oracle) => (
                <li key={oracle.id}>
                  {renderOracle(oracle, { current: selectedId === oracle.id })}
                </li>
              ))}
            </Stack>
          </Stack>
        )}
        {groups.map(([packageId, ruleset]) => (
          <DataswornTreeGroup
            key={packageId}
            title={showGroupTitles ? ruleset.title : undefined}
          >
            {ruleset.rootCollectionIds.map((collectionId) => (
              <DataswornOracleCollection
                key={collectionId}
                collectionId={collectionId}
                collectionMap={oracleCollectionMap}
                renderOracle={renderOracle}
                headingLevel={showGroupTitles ? 4 : 3}
              />
            ))}
          </DataswornTreeGroup>
        ))}
        {search && resultCount === 0 && (
          <Text color="muted" variant="bodySm" css={{ paddingInline: "3" }}>
            {noResults}
          </Text>
        )}
      </Stack>
    </DataswornTreeContext.Provider>
  );
}
