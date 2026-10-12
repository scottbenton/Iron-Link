import type { IWorldEntry } from "services/worldEntries.service";
import type { IWorldEntryFieldValue } from "services/worldEntryFieldValues.service";

import type {
  WorldFieldEntrySnapshot,
  WorldFieldSnapshot,
} from "./worldFieldRules";

export type WorldFieldEntrySnapshots = Record<string, WorldFieldEntrySnapshot>;

/**
 * Every entry this client can read, with the values it can read, in the shape
 * field rules evaluate. Build it once per change to the entries or values and
 * pick each entry's snapshot from it with getWorldFieldSnapshot.
 */
export function buildWorldFieldEntrySnapshots(
  entries: Readonly<Record<string, Pick<IWorldEntry, "id" | "parentEntryId">>>,
  valuesByEntry: Readonly<
    Record<string, Readonly<Record<string, IWorldEntryFieldValue>>>
  >,
): WorldFieldEntrySnapshots {
  return Object.fromEntries(
    Object.values(entries).map((entry) => [
      entry.id,
      {
        id: entry.id,
        parentId: entry.parentEntryId,
        values: Object.fromEntries(
          Object.entries(valuesByEntry[entry.id] ?? {}).map(
            ([fieldId, value]) => [fieldId, value.value],
          ),
        ),
      },
    ]),
  );
}

// What resolveFieldDefinition needs to judge one entry's fields, or undefined
// when the entry is not loaded.
export function getWorldFieldSnapshot(
  entryId: string,
  entries: WorldFieldEntrySnapshots,
): WorldFieldSnapshot | undefined {
  const entry = entries[entryId];
  return entry ? { entry, entries } : undefined;
}
