import { Alert, Box, LinearProgress, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";

import { useWorldIsGuided } from "stores/world.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { getWorldEntryPath, isTopLevelWorldEntry } from "lib/worldEntryParents";

import { IWorldCategory } from "services/worldCategories.service";

import type { WorldNavigation } from "../worldNavigation";
import { WorldEntryCardRow, WorldEntryCards } from "./WorldEntryCards";
import { getEditorErrorMessage } from "./categoryEditor.utils";
import { useWorldEntryRows } from "./useWorldEntryRows";

// A category opened like a Notes folder: its entries as note cards, by name.
// With nesting, only its top level shows, and entries holding others are
// folder cards that open into their Places.
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
  const { entries, subtitleOf, rowOf } = useWorldEntryRows(category);
  const nesting = category.supportsHierarchy;
  const inCategory = Object.values(entries)
    .filter((entry) => entry.categoryId === category.id)
    .sort((a, b) => a.name.localeCompare(b.name));
  const query = search.trim().toLocaleLowerCase();
  // A filter searches every level, giving each match its path; otherwise a
  // category with nesting lists only its top level.
  const rows: WorldEntryCardRow[] = query
    ? inCategory.flatMap((entry) => {
        const subtitle = subtitleOf(entry);
        if (
          !entry.name.toLocaleLowerCase().includes(query) &&
          !subtitle?.toLocaleLowerCase().includes(query)
        )
          return [];
        const path = nesting ? getWorldEntryPath(entries, entry.id) : "";
        return [
          {
            entry,
            folder: false,
            subtitle: [subtitle, path].filter(Boolean).join(" · "),
          },
        ];
      })
    : inCategory
        .filter((entry) => !nesting || isTopLevelWorldEntry(entries, entry))
        .map(rowOf);
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
      ) : rows.length === 0 ? (
        <EmptyState
          title={
            inCategory.length === 0
              ? t("worlds.categories.no-entries-title", "No entries yet")
              : undefined
          }
          message={
            inCategory.length === 0
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
        <>
          {query && nesting && (
            <Typography
              variant="body2"
              color="text.secondary"
              role="status"
              sx={{ mb: 1 }}
            >
              {t(
                "worlds.categories.matches-every-level",
                "{{count}} matches across every level",
                {
                  count: rows.length,
                  defaultValue_one: "1 match across every level",
                },
              )}
            </Typography>
          )}
          <WorldEntryCards
            rows={rows}
            category={category}
            guided={guided}
            navigation={navigation}
            onDeleted={() => setActionError(undefined)}
            onError={(cause) => setActionError(getEditorErrorMessage(cause))}
          />
        </>
      )}
    </Box>
  );
}
