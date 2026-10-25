import { Alert } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";

import { useWorldIsGuided } from "stores/world.store";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldEntry } from "services/worldEntries.service";

import { WorldEntryCards } from "../categories/WorldEntryCards";
import { getEditorErrorMessage } from "../categories/categoryEditor.utils";
import { useWorldEntryRows } from "../categories/useWorldEntryRows";
import type { WorldNavigation } from "../worldNavigation";

// An entry's Places: the entries directly inside it, by name, with those
// holding places of their own as folder cards.
export function WorldEntryPlaces({
  entry,
  category,
  navigation,
}: {
  entry: IWorldEntry;
  category: IWorldCategory;
  navigation: WorldNavigation;
}) {
  const { t } = useTranslation();
  const guided = useWorldIsGuided();
  const [actionError, setActionError] = useState<string>();
  const { entries, rowOf } = useWorldEntryRows(category);
  const rows = Object.values(entries)
    .filter(
      (child) =>
        child.parentEntryId === entry.id && child.categoryId === category.id,
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(rowOf);

  return (
    <section
      aria-label={t("worlds.entries.places-in", "Places in {{name}}", {
        name: entry.name,
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
      {rows.length === 0 ? (
        <EmptyState
          message={t(
            "worlds.entries.no-places",
            "Nothing is inside {{name}} yet.",
            { name: entry.name },
          )}
          sx={{ py: 4 }}
        />
      ) : (
        <WorldEntryCards
          rows={rows}
          category={category}
          guided={guided}
          navigation={navigation}
          onDeleted={() => setActionError(undefined)}
          onError={(cause) => setActionError(getEditorErrorMessage(cause))}
        />
      )}
    </section>
  );
}
