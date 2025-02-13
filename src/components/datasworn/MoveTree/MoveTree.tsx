import SearchIcon from "@mui/icons-material/Search";
import { Box, Input, InputAdornment, List, ListSubheader } from "@mui/material";
import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useMoves } from "stores/dataswornTree.store";

import { MoveCategoryListItem } from "./MoveCategoryListItem";
import {
  CategoryVisibilityState,
  MoveVisibilityState,
  VisibilitySettings,
  getMoveCategoryVisibility,
} from "./getMoveCategoryVisibility";

export function MoveTree() {
  const { t } = useTranslation();

  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue);

  const { rootMoveCategories, moveCategoryMap, moveMap } = useMoves();

  const visibilitySettings = useMemo(() => {
    const visibleCollections: Record<string, CategoryVisibilityState> = {};
    const visibleOracles: Record<string, MoveVisibilityState> = {};

    Object.values(rootMoveCategories).forEach(({ rootCollectionIds }) => {
      rootCollectionIds.forEach((moveId) => {
        getMoveCategoryVisibility(
          deferredSearchValue,
          moveId,
          moveCategoryMap,
          moveMap,
          visibleCollections,
          visibleOracles,
        );
      });
    });

    return {
      visibleCategories: visibleCollections,
      visibleMoves: visibleOracles,
    } as VisibilitySettings;
  }, [rootMoveCategories, moveCategoryMap, moveMap, deferredSearchValue]);

  return (
    <Box bgcolor={"background.paper"}>
      <Input
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        fullWidth
        startAdornment={
          <InputAdornment position={"start"}>
            <SearchIcon sx={(theme) => ({ color: theme.palette.grey[300] })} />
          </InputAdornment>
        }
        aria-label={t("datasworn.filter-moves", "Filter Moves")}
        placeholder={t("datasworn.filter-moves", "Filter Moves")}
        color={"primary"}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          px: 2,
          py: 1,
        }}
      />
      {Object.entries(rootMoveCategories).map(
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
                  zIndex: 3,
                })}
                key={rulesetKey}
              >
                {ruleset.title}
              </ListSubheader>
            )}
            {ruleset.rootCollectionIds.map((categoryKey) => (
              <MoveCategoryListItem
                key={categoryKey}
                moveCategoryId={categoryKey}
                moveCategoryMap={moveCategoryMap}
                moveMap={moveMap}
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
