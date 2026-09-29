import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { RichTreeView } from "@mui/x-tree-view";
import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type {
  WorldOracleCatalog,
  WorldOracleChoice,
} from "lib/worldOracleCatalog";
import {
  type WorldOracleTreeItem,
  buildWorldOracleTree,
  filterWorldOracleTree,
} from "lib/worldOracleTree";

export function WorldOracleTreePicker({
  catalog,
  allPackages,
  exact,
  selectedId,
  disabled,
  onSelect,
}: {
  catalog: WorldOracleCatalog;
  allPackages: boolean;
  exact: boolean;
  selectedId?: string;
  disabled: boolean;
  onSelect: (choice: WorldOracleChoice) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search);
  const [expanded, setExpanded] = useState<string[]>([]);
  const tree = useMemo(
    () => buildWorldOracleTree(catalog, allPackages, exact),
    [catalog, allPackages, exact],
  );
  const items = useMemo(
    () => filterWorldOracleTree(tree, query),
    [tree, query],
  );
  const searchExpanded = useMemo(() => {
    const ids: string[] = [];
    const walk = (item: WorldOracleTreeItem) => {
      if (item.children?.length) {
        ids.push(item.id);
        item.children.forEach(walk);
      }
    };
    items.forEach(walk);
    return ids;
  }, [items]);
  return (
    <Stack spacing={1}>
      <TextField
        autoFocus
        size="small"
        label={t("worlds.fields.find-oracle", "Find an oracle")}
        value={search}
        disabled={disabled}
        onChange={(event) => setSearch(event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />
      <Box
        sx={{
          height: 360,
          overflow: "auto",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          p: 1,
        }}
      >
        {items.length ? (
          <RichTreeView
            aria-label={t("worlds.fields.oracle-tree", "Available oracles")}
            items={items}
            selectedItems={selectedId ?? null}
            expandedItems={query.trim() ? searchExpanded : expanded}
            onExpandedItemsChange={(_, ids) => setExpanded(ids)}
            isItemDisabled={() => disabled}
            onSelectedItemsChange={(_, id) => {
              const choice = catalog.choices.find(
                (candidate) => candidate.id === id,
              );
              if (choice && !disabled) onSelect(choice);
            }}
          />
        ) : (
          <Typography color="text.secondary" sx={{ p: 1 }}>
            {t(
              "worlds.fields.no-matching-oracles",
              "No matching oracles. Try another search or include all packages.",
            )}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
