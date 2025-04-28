import { InputGroup } from "@/components/ui/input-group";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { useMoves } from "@/stores/dataswornTree.store";
import { Box, Icon, Input } from "@chakra-ui/react";
import { SearchIcon } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import {
  CollectionVisibility,
  ItemVisibility,
  VisibilitySettings,
  getCollectionVisibilities,
} from "../getCollectionVisibility";

export function MoveList() {
  const t = useDataswornTranslations();

  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue);
  const { rootMoveCategories, moveCategoryMap, moveMap } = useMoves();

  const visibilitySettings = useMemo(() => {
    const collectionVisibility: Record<string, CollectionVisibility> = {};
    const itemVisibility: Record<string, ItemVisibility> = {};

    Object.values(rootMoveCategories).forEach(({ rootCollectionIds }) => {
      getCollectionVisibilities(
        deferredSearchValue,
        rootCollectionIds,
        moveCategoryMap,
        moveMap,
        collectionVisibility,
        itemVisibility,
      );
    });

    return {
      collectionVisibility,
      itemVisibility,
    } as VisibilitySettings;
  }, [rootMoveCategories, moveCategoryMap, moveMap, deferredSearchValue]);

  return (
    <Box>
      <InputGroup
        startElement={
          <Icon asChild size="sm">
            <SearchIcon />
          </Icon>
        }
        w="100%"
      >
        <Input
          variant="subtle"
          borderRadius="none"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          aria-label={t("filter-moves", "Filter Moves")}
          placeholder={t("filter-moves", "Filter Moves")}
          color={"primary"}
        />
      </InputGroup>
      {Object.entries(rootMoveCategories).map(
        ([rulesetKey, ruleset], _, arr) => (
          <ul key={rulesetKey}>
            {arr.length > 1 && (
              <li
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
              </li>
            )}
            {ruleset.rootCollectionIds.map((categoryKey) => (
              <li>{moveCategoryMap[categoryKey].name}</li>
              //   <MoveCategoryListItem
              //     key={categoryKey}
              //     moveCategoryId={categoryKey}
              //     moveCategoryMap={moveCategoryMap}
              //     moveMap={moveMap}
              //     visibilitySettings={visibilitySettings}
              //     isSearchActive={!!deferredSearchValue.trim()}
              //   />
            ))}
          </ul>
        ),
      )}
    </Box>
  );
}
