import { Alert, Box, LinearProgress } from "@mui/material";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";

import {
  useListenToWorldEntries,
  useWorldEntriesStore,
} from "stores/worldEntries.store";

import { IWorldCategory } from "services/worldCategories.service";

import { WorldCategoryEntryItem } from "./WorldCategoryEntryItem";

export function WorldCategoryContents({
  category,
  search,
}: {
  category: IWorldCategory;
  search: string;
}) {
  const { t } = useTranslation();
  useListenToWorldEntries(category.worldId);
  const loading = useWorldEntriesStore((store) => store.entryState.loading);
  const error = useWorldEntriesStore((store) => !!store.entryState.error);
  const visible = useWorldEntriesStore((store) =>
    Object.values(store.entryState.entries)
      .filter((entry) => entry.categoryId === category.id)
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
  const filtered = visible.filter((entry) =>
    entry.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <Box
      component="section"
      aria-label={t("worlds.categories.entries", "{{category}} entries", {
        category: category.name,
      })}
    >
      {error ? (
        <Alert severity="error">
          {t(
            "worlds.categories.entries-error",
            "Could not load this category. Please reopen it to try again.",
          )}
        </Alert>
      ) : loading ? (
        <LinearProgress
          aria-label={t("worlds.categories.loading-entries", "Loading entries")}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            visible.length === 0
              ? t("worlds.categories.no-entries-title", "No entries yet")
              : undefined
          }
          message={
            visible.length === 0
              ? t(
                  "worlds.categories.no-entries",
                  "No entries in this category yet.",
                )
              : t(
                  "worlds.categories.no-search-results",
                  "No entries match your search.",
                )
          }
          sx={{ py: 4 }}
        />
      ) : (
        <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
          {filtered.map((entry) => (
            <WorldCategoryEntryItem key={entry.id} entry={entry} />
          ))}
        </Box>
      )}
    </Box>
  );
}
