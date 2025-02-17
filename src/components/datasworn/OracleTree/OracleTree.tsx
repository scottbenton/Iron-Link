import SearchIcon from "@mui/icons-material/Search";
import { Box, Input, InputAdornment, List, ListSubheader } from "@mui/material";
import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useOracles } from "stores/dataswornTree.store";

import {
  CollectionVisibility,
  ItemVisibility,
  VisibilitySettings,
  getCollectionVisibilities,
} from "../_helpers/getCollectionVisibility";
import { AskTheOracleButtons } from "./AskTheOracleButtons";
import { OracleCollectionListItem } from "./OracleCollectionListItem";

export function OracleTree() {
  const { t } = useTranslation();

  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue);

  const { rootOracleCollections, oracleCollectionMap, oracleRollableMap } =
    useOracles();

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

  return (
    <Box bgcolor={"background.paper"}>
      <AskTheOracleButtons />
      <Input
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        fullWidth
        startAdornment={
          <InputAdornment position={"start"}>
            <SearchIcon sx={(theme) => ({ color: theme.palette.grey[300] })} />
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
      {Object.entries(rootOracleCollections).map(
        ([rulesetKey, ruleset], _, arr) => (
          <List key={rulesetKey} disablePadding>
            {arr.length > 1 && (
              <ListSubheader
                sx={(theme) => ({
                  bgcolor:
                    theme.palette.mode === "light" ? "grey.300" : "grey.950",
                  mt: 0,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  px: 2,
                  fontFamily: theme.typography.fontFamilyTitle,
                })}
                key={rulesetKey}
              >
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
  );
}
