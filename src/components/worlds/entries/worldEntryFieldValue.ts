import {
  type ResolvedWorldFieldDefinition,
  getWorldFieldKind,
} from "lib/worldFieldRules";

import type { IWorldEntry } from "services/worldEntries.service";
import type {
  IWorldEntryFieldValue,
  WorldFieldValue,
} from "services/worldEntryFieldValues.service";

// A single field stores a string and a multiple one an array. Reading either
// as a list keeps values written before "Allow more than one" changed.
export function getWorldFieldValueList(
  value: WorldFieldValue | null | undefined,
): string[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

// Whether a read-only view has anything to show for this field. Long text
// keeps its document outside the store, so any stored row counts; a linked
// entry counts only links to entries this reader can see.
export function hasWorldEntryFieldValue(
  field: ResolvedWorldFieldDefinition,
  value: IWorldEntryFieldValue | undefined,
  entries: Readonly<Record<string, Pick<IWorldEntry, "categoryId">>>,
): boolean {
  if (!value) return false;
  switch (getWorldFieldKind(field)) {
    case "longText":
      return true;
    case "linkedEntry":
      return getWorldFieldValueList(value.value).some(
        (id) =>
          entries[id]?.categoryId === field.configuration.targetCategoryId,
      );
    default:
      return getWorldFieldValueList(value.value).some((item) => !!item.trim());
  }
}
