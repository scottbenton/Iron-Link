import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { getLocationTypeIcon } from "lib/worldMap/locationTypeIcons";

import { IWorldEntry } from "services/worldEntries.service";

import { WorldCategoryIcon } from "../categories/WorldCategoryIcon";
import { WorldEntryIcon } from "../entries/WorldEntryIcon";

// A pin's icon: the entry's picture or icon, else one for its Location Type,
// else its category's icon.
export function WorldMapPinIcon({ entry }: { entry: IWorldEntry }) {
  const typeFieldIds = useWorldCategoriesStore((store) =>
    Object.values(store.fieldDefinitions)
      .filter(
        (field) =>
          field.categoryId === entry.categoryId && field.key === "locationType",
      )
      .map((field) => field.id),
  );
  const locationType = useWorldEntriesStore((store) => {
    const values = store.fieldValueState.valuesByEntry[entry.id];
    const value = typeFieldIds
      .map((id) => values?.[id]?.value)
      .find((found) => found);
    return Array.isArray(value) ? value[0] : (value ?? undefined);
  });
  const typeIcon =
    !entry.imageFilename && !entry.icon?.key
      ? getLocationTypeIcon(locationType)
      : undefined;
  return typeIcon ? (
    <WorldCategoryIcon icon={typeIcon} size="small" />
  ) : (
    <WorldEntryIcon entry={entry} size="small" />
  );
}
