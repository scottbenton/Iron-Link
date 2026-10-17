import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useWorldFieldEntrySnapshots } from "hooks/useWorldFieldEntrySnapshots";

import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { countWorldEntryChildren } from "lib/worldEntryParents";
import { getWorldEntrySubtitle } from "lib/worldEntrySubtitle";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldEntry } from "services/worldEntries.service";

import type { WorldEntryCardRow } from "./WorldEntryCards";

// What a category's entry cards need: each entry's subtitle, and whether it
// holds other entries, which makes it a folder card counting its places.
export function useWorldEntryRows(category: IWorldCategory) {
  const { t } = useTranslation();
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const subtitleField = useWorldCategoriesStore((store) =>
    category.subtitleFieldDefinitionId
      ? store.fieldDefinitions[category.subtitleFieldDefinitionId]
      : undefined,
  );
  const snapshots = useWorldFieldEntrySnapshots();
  const childCounts = useMemo(
    () => countWorldEntryChildren(entries),
    [entries],
  );

  const subtitleOf = (entry: IWorldEntry) =>
    getWorldEntrySubtitle(subtitleField, entry.id, snapshots, entries);
  const rowOf = (entry: IWorldEntry): WorldEntryCardRow => {
    const subtitle = subtitleOf(entry);
    const count = category.supportsHierarchy ? (childCounts[entry.id] ?? 0) : 0;
    if (count === 0) return { entry, subtitle, folder: false };
    return {
      entry,
      folder: true,
      subtitle: [
        subtitle,
        t("worlds.entries.place-count", "{{count}} places", {
          count,
          defaultValue_one: "{{count}} place",
        }),
      ]
        .filter(Boolean)
        .join(" · "),
    };
  };
  return { entries, childCounts, subtitleOf, rowOf };
}
