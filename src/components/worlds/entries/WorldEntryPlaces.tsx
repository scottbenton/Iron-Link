import { Alert } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";

import { useWorldIsGuided } from "stores/world.store";
import { useWorldEntryLayout } from "stores/worldEntryLayout.store";

import { getWorldEntryTree } from "lib/worldEntryParents";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldEntry } from "services/worldEntries.service";

import { WorldEntryCards } from "../categories/WorldEntryCards";
import { WorldEntryList } from "../categories/WorldEntryList";
import { getEditorErrorMessage } from "../categories/categoryEditor.utils";
import { useWorldEntryRows } from "../categories/useWorldEntryRows";
import type { WorldNavigation } from "../worldNavigation";

// An entry's Places: the entries directly inside it, by name, in its
// category's layout: cards, with those holding places of their own as folder
// cards, or the list, a tree from here down.
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
  const layout = useWorldEntryLayout(category);
  const { entries, rowOf, subtitleOf } = useWorldEntryRows(category);
  const tree = getWorldEntryTree(entries, category.id);
  const inside = tree.children[entry.id] ?? [];
  const rows =
    layout === "list"
      ? inside.map((child) => ({
          entry: child,
          folder: false,
          subtitle: subtitleOf(child),
        }))
      : inside.map(rowOf);

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
      ) : layout === "list" ? (
        <WorldEntryList
          rows={rows}
          tree={tree.children}
          subtitleOf={subtitleOf}
          category={category}
          guided={guided}
          navigation={navigation}
          onDeleted={() => setActionError(undefined)}
          onError={(cause) => setActionError(getEditorErrorMessage(cause))}
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
