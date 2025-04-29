import { List, ListSubheader } from "@/components/common/ListItem";
import { InputGroup } from "@/components/ui/input-group";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { useOracles } from "@/stores/dataswornTree.store";
import { Box, Icon, Input } from "@chakra-ui/react";
import { SearchIcon } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import {
  CollectionVisibility,
  ItemVisibility,
  VisibilitySettings,
  getCollectionVisibilities,
} from "../getCollectionVisibility";
import { AskTheOracleButtons } from "./AskTheOracleButtons";
import { OracleCollectionListItem } from "./OracleCollectionListItem";

export function OracleList() {
  const t = useDataswornTranslations();

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
    <Box>
      <AskTheOracleButtons />
      <InputGroup
        startElement={
          <Icon asChild size="sm">
            <SearchIcon />
          </Icon>
        }
        w="100%"
      >
        <Input
          variant="flushed"
          borderRadius="none"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          aria-label={t("filter-oracles", "Filter Oracles")}
          placeholder={t("filter-oracles", "Filter Oracles")}
          color={"primary"}
        />
      </InputGroup>
      {Object.entries(rootOracleCollections).map(
        ([rulesetKey, ruleset], _, arr) => (
          <List key={rulesetKey}>
            {arr.length > 1 && <ListSubheader>{ruleset.title}</ListSubheader>}
            {ruleset.rootCollectionIds.map((categoryKey) => (
              <OracleCollectionListItem
                key={categoryKey}
                oracleCollectionId={categoryKey}
                oracleCollectionMap={oracleCollectionMap}
                oracleRollableMap={oracleRollableMap}
                visibilitySettings={visibilitySettings}
                isSearchActive={!!deferredSearchValue}
              />
            ))}
          </List>
        ),
      )}
    </Box>
  );
}
