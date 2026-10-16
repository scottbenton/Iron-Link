import { Alert, Box, LinearProgress } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";

import { useWorldFieldEntrySnapshots } from "hooks/useWorldFieldEntrySnapshots";

import { useWorldIsGuided } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { getWorldEntrySubtitle } from "lib/worldEntrySubtitle";

import { IWorldCategory } from "services/worldCategories.service";

import type { WorldNavigation } from "../worldNavigation";
import { WorldCategoryEntryItem } from "./WorldCategoryEntryItem";
import { getEditorErrorMessage } from "./categoryEditor.utils";

// A category opened like a Notes folder: its entries as note cards, by name.
// Entries are listened to by the surrounding manager, which keeps them loaded
// while moving between this list and an entry.
export function WorldCategoryContents({
  category,
  search,
  navigation,
}: {
  category: IWorldCategory;
  search: string;
  navigation: WorldNavigation;
}) {
  const { t } = useTranslation();
  const guided = useWorldIsGuided();
  const [actionError, setActionError] = useState<string>();
  const loading = useWorldEntriesStore((store) => store.entryState.loading);
  const error = useWorldEntriesStore((store) => !!store.entryState.error);
  const visible = useWorldEntriesStore((store) =>
    Object.values(store.entryState.entries)
      .filter((entry) => entry.categoryId === category.id)
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
  const subtitleField = useWorldCategoriesStore((store) =>
    category.subtitleFieldDefinitionId
      ? store.fieldDefinitions[category.subtitleFieldDefinitionId]
      : undefined,
  );
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const snapshots = useWorldFieldEntrySnapshots();
  const rows = visible.map((entry) => ({
    entry,
    subtitle: getWorldEntrySubtitle(
      subtitleField,
      entry.id,
      snapshots,
      entries,
    ),
  }));
  const query = search.trim().toLocaleLowerCase();
  const filtered = rows.filter(
    ({ entry, subtitle }) =>
      entry.name.toLocaleLowerCase().includes(query) ||
      !!subtitle?.toLocaleLowerCase().includes(query),
  );
  return (
    <Box
      component="section"
      aria-label={t("worlds.categories.entries", "{{category}} entries", {
        category: category.name,
      })}
    >
      {actionError && (
        <Alert
          severity="error"
          onClose={() => setActionError(undefined)}
          sx={{ mb: 1 }}
        >
          {actionError}
        </Alert>
      )}
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
        // Cards in columns where there is room, like the folders in Notes,
        // and one full-width list when there is not.
        <Box sx={{ containerType: "inline-size" }}>
          <Box
            component="ul"
            sx={{
              listStyle: "none",
              p: 0,
              m: 0,
              display: "grid",
              gap: 1,
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              "@container (max-width: 560px)": { gridTemplateColumns: "1fr" },
            }}
          >
            {filtered.map(({ entry, subtitle }) => (
              <WorldCategoryEntryItem
                key={entry.id}
                entry={entry}
                category={category}
                subtitle={subtitle}
                guided={guided}
                onDeleted={() => setActionError(undefined)}
                onError={(cause) =>
                  setActionError(getEditorErrorMessage(cause))
                }
                linkProps={navigation.getLinkProps({
                  type: "entry",
                  categoryId: category.id,
                  entryId: entry.id,
                })}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
