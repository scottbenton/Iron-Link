import { useWorldFieldEntrySnapshots } from "hooks/useWorldFieldEntrySnapshots";

import { useWorldPermission } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import {
  useWorldEntriesStore,
  useWorldEntryFieldValues,
} from "stores/worldEntries.store";

import { resolveFieldDefinition } from "lib/worldFieldRules";
import { getWorldFieldSnapshot } from "lib/worldFieldSnapshot";

import { isGuideEquivalent } from "repositories/shared.types";

import { IWorldEntry } from "services/worldEntries.service";

// An entry's fields in their configured order, each resolved by its rules
// for this entry and its ancestors, with the values they hold. Guide-only
// fields are left out for everyone but Guides, and so are fields a rule
// hides.
export function useResolvedWorldEntryFields(
  entry: Pick<IWorldEntry, "id" | "parentEntryId" | "categoryId">,
) {
  const permission = useWorldPermission();
  const isGuide = !!permission && isGuideEquivalent(permission);
  const definitions = useWorldCategoriesStore((store) =>
    Object.values(store.fieldDefinitions)
      .filter(
        (definition) =>
          definition.categoryId === entry.categoryId &&
          (isGuide || !definition.gmOnly),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder),
  );
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const values = useWorldEntryFieldValues(entry.id);
  const snapshots = useWorldFieldEntrySnapshots();
  const snapshot = getWorldFieldSnapshot(entry.id, snapshots) ?? {
    entry: { id: entry.id, parentId: entry.parentEntryId, values: {} },
    entries: snapshots,
  };
  const fields = definitions
    .map((definition) => resolveFieldDefinition(definition, snapshot))
    .filter((field) => field.visible);
  return { fields, values, entries, isGuide };
}
