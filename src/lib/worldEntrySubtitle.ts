import type { IWorldFieldDefinition } from "types/worldField.type";

import type { IWorldEntry } from "services/worldEntries.service";

import { getWorldFieldKind, resolveFieldDefinition } from "./worldFieldRules";
import {
  type WorldFieldEntrySnapshots,
  getWorldFieldSnapshot,
} from "./worldFieldSnapshot";

/**
 * The text a list shows under an entry's name: its category's subtitle field,
 * when that field applies to the entry. Long text never shows, and linked
 * entries show the names of the ones this client can read.
 */
export function getWorldEntrySubtitle(
  definition: IWorldFieldDefinition | undefined,
  entryId: string,
  snapshots: WorldFieldEntrySnapshots,
  entries: Readonly<Record<string, Pick<IWorldEntry, "name">>>,
): string | undefined {
  if (!definition) return undefined;
  const snapshot = getWorldFieldSnapshot(entryId, snapshots);
  if (!snapshot || !resolveFieldDefinition(definition, snapshot).visible)
    return undefined;
  const value = snapshot.entry.values[definition.id];
  const values = (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === "string" && !!item.trim(),
  );
  let parts: string[];
  switch (getWorldFieldKind(definition)) {
    case "longText":
      return undefined;
    case "linkedEntry":
      parts = values.flatMap((id) => {
        const name = entries[id]?.name;
        return name ? [name] : [];
      });
      break;
    default:
      parts = values;
  }
  return parts.length ? parts.join(", ") : undefined;
}
