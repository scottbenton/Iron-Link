import { Datasworn } from "@datasworn-community/core";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Input,
  InputAdornment,
  List,
  ListSubheader,
  SxProps,
  Theme,
} from "@mui/material";
import { useDeferredValue, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAnnounceSearchResults } from "hooks/useAnnounceSearchResults";

import { useOracles } from "stores/dataswornTree.store";

import { countVisibleItems } from "../_helpers/countVisibleItems";
import {
  CollectionVisibility,
  ItemVisibility,
  VisibilitySettings,
  getCollectionVisibilities,
} from "../_helpers/getCollectionVisibility";
import {
  TreeLinkMode,
  TreeLinkModeContext,
  useLinkModeTree,
} from "../_helpers/treeLinkMode";
import { AskTheOracleButtons } from "./AskTheOracleButtons";
import { OracleCollectionListItem } from "./OracleCollectionListItem";
import { OracleListItem } from "./OracleListItem";

const subheaderSx: SxProps<Theme> = (theme) => ({
  bgcolor: theme.palette.mode === "light" ? "grey.300" : "grey.950",
  mt: 0,
  borderBottom: `1px solid ${theme.palette.divider}`,
  px: 2,
  fontFamily: theme.typography.fontFamilyTitle,
});

export interface OracleTreeFeaturedOracle {
  oracleId: string;
  // Read under the oracle's name, such as the fields that roll it.
  description?: string;
}

export interface OracleTreeProps {
  // Oracles become links to their own pages instead of rolling on a click.
  linkMode?: TreeLinkMode;
  // Oracles listed first under their own heading, above the rules packages.
  // The filter narrows them by name; ones not in the rules are left out.
  featured?: {
    title: string;
    oracles: OracleTreeFeaturedOracle[];
  };
}

export function OracleTree(props: OracleTreeProps) {
  const { linkMode, featured } = props;
  const { t } = useTranslation();

  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue);

  const oracles = useOracles();
  const { oracleRollableMap } = oracles;
  const {
    rootCollections: rootOracleCollections,
    collectionMap: oracleCollectionMap,
    contextValue,
  } = useLinkModeTree(
    linkMode,
    oracles.rootOracleCollections,
    oracles.oracleCollectionMap,
  );

  const visibilitySettings = useMemo(() => {
    const collectionVisibility: Record<string, CollectionVisibility> = {};
    const itemVisibility: Record<string, ItemVisibility> = {};

    Object.values(rootOracleCollections).forEach(({ rootCollectionIds }) => {
      getCollectionVisibilities(
        deferredSearchValue,
        rootCollectionIds,
        oracleCollectionMap,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oracleRollableMap as unknown as any,
        collectionVisibility,
        itemVisibility,
      );
    });
    return {
      collectionVisibility,
      itemVisibility,
    } as VisibilitySettings;
  }, [
    rootOracleCollections,
    oracleCollectionMap,
    oracleRollableMap,
    deferredSearchValue,
  ]);

  const featuredOracles = useMemo(() => {
    const search = deferredSearchValue.trim().toLowerCase();
    return (featured?.oracles ?? []).flatMap(({ oracleId, description }) => {
      // Only an oracle in the rules can roll; a bound one the playset leaves
      // out is not offered here.
      const oracle = oracleRollableMap[oracleId] as
        | Datasworn.OracleRollable
        | undefined;
      if (!oracle) return [];
      if (search && !oracle.name.toLowerCase().includes(search)) return [];
      // A description that only repeats the name is left out.
      return [
        {
          oracle,
          description:
            description?.toLowerCase() === oracle.name.toLowerCase()
              ? undefined
              : description,
        },
      ];
    });
  }, [featured, oracleRollableMap, deferredSearchValue]);

  const resultCount = useMemo(
    () =>
      countVisibleItems(
        Object.values(rootOracleCollections).flatMap(
          ({ rootCollectionIds }) => rootCollectionIds,
        ),
        oracleCollectionMap,
        visibilitySettings,
      ),
    [rootOracleCollections, oracleCollectionMap, visibilitySettings],
  );
  useAnnounceSearchResults(
    deferredSearchValue,
    resultCount === 0
      ? t("datasworn.filter-oracles-no-results", "No oracles found")
      : t("datasworn.filter-oracles-results", "{{count}} oracles found", {
          count: resultCount,
          defaultValue_one: "1 oracle found",
        }),
  );

  const featuredHeadingId = useId();

  return (
    <TreeLinkModeContext.Provider value={contextValue}>
      <Box bgcolor={"background.paper"}>
        <AskTheOracleButtons />
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          fullWidth
          startAdornment={
            <InputAdornment position={"start"}>
              <SearchIcon
                sx={(theme) => ({ color: theme.palette.grey[300] })}
              />
            </InputAdornment>
          }
          aria-label={t("datasworn.filter-oracles", "Filter Oracles")}
          placeholder={t("datasworn.filter-oracles", "Filter Oracles")}
          color={"primary"}
          sx={{
            bgcolor: "background.paper",
            color: "text.primary",
            px: 2,
            py: 1,
          }}
        />
        {featured && featuredOracles.length > 0 && (
          <List
            disablePadding
            aria-labelledby={featuredHeadingId}
            sx={(theme) => ({
              borderBottom: `1px solid ${theme.palette.divider}`,
            })}
          >
            <ListSubheader id={featuredHeadingId} sx={subheaderSx}>
              {featured.title}
            </ListSubheader>
            {featuredOracles.map(({ oracle, description }) => (
              <OracleListItem
                key={oracle._id}
                oracle={oracle}
                description={description}
                visibilitySettings={visibilitySettings}
                isSearchActive={false}
                isFullCollectionVisible
              />
            ))}
          </List>
        )}
        {Object.entries(rootOracleCollections).map(
          ([rulesetKey, ruleset], _, arr) => (
            <List key={rulesetKey} disablePadding>
              {(arr.length > 1 || featuredOracles.length > 0) && (
                <ListSubheader sx={subheaderSx} key={rulesetKey}>
                  {ruleset.title}
                </ListSubheader>
              )}
              {ruleset.rootCollectionIds.map((collectionKey) => (
                <OracleCollectionListItem
                  key={collectionKey}
                  oracleCollectionId={collectionKey}
                  oracleCollectionMap={oracleCollectionMap}
                  oracleRollableMap={oracleRollableMap}
                  visibilitySettings={visibilitySettings}
                  isSearchActive={!!deferredSearchValue.trim()}
                />
              ))}
            </List>
          ),
        )}
      </Box>
    </TreeLinkModeContext.Provider>
  );
}
