import type { IWorldFieldDefinition } from "types/worldField.type";

import type { IWorldEntry } from "services/worldEntries.service";
import type { IWorldEntryFieldValue } from "services/worldEntryFieldValues.service";

import { isWorldFieldLinkedEntry } from "./worldFieldRules";

/**
 * The loaded entries whose Linked entry values point at this entry, sorted by
 * name. Entries and values this client cannot read are not counted, so this
 * describes what the reader can see, not every link.
 */
export function getWorldEntriesLinkingTo(
  entry: Pick<IWorldEntry, "id" | "categoryId">,
  definitions: Readonly<Record<string, IWorldFieldDefinition>>,
  valuesByEntry: Readonly<
    Record<string, Readonly<Record<string, IWorldEntryFieldValue>>>
  >,
  entries: Readonly<Record<string, IWorldEntry>>,
): IWorldEntry[] {
  const linkFieldIds = Object.values(definitions)
    .filter(
      (definition) =>
        isWorldFieldLinkedEntry(definition) &&
        definition.configuration.targetCategoryId === entry.categoryId,
    )
    .map((definition) => definition.id);
  return Object.entries(valuesByEntry)
    .filter(
      ([entryId, values]) =>
        entryId !== entry.id &&
        linkFieldIds.some((fieldId) => {
          const value = values[fieldId]?.value;
          return Array.isArray(value)
            ? value.includes(entry.id)
            : value === entry.id;
        }),
    )
    .flatMap(([entryId]) => (entries[entryId] ? [entries[entryId]] : []))
    .sort((a, b) => a.name.localeCompare(b.name));
}
