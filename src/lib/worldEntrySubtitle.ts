import type { IWorldFieldDefinition } from "types/worldField.type";

import type { IWorldEntry } from "services/worldEntries.service";

import { normalizeWorldFieldConfiguration } from "./worldFieldConfiguration";
import { getWorldFieldKind, resolveFieldDefinition } from "./worldFieldRules";
import {
  type WorldFieldEntrySnapshots,
  getWorldFieldSnapshot,
} from "./worldFieldSnapshot";

// A field shown instead of the subtitle field for entries whose subtitle
// field holds `value`, such as Region for a Location whose type is Sector.
export interface WorldEntrySubtitleOverride {
  value: string;
  field: IWorldFieldDefinition;
}

/**
 * Whether a field can choose subtitles per value: only a single-choice
 * option list gives each entry one value to look the override up by.
 */
export function canWorldSubtitleFieldHaveOverrides(
  definition: Pick<IWorldFieldDefinition, "type" | "configuration">,
): boolean {
  return (
    getWorldFieldKind(definition) === "optionList" &&
    !normalizeWorldFieldConfiguration(definition.configuration, definition.type)
      .multiple
  );
}

/**
 * A category's overrides with their field definitions, leaving out any whose
 * field is gone. None apply while the subtitle field is not a single-choice
 * option list.
 */
export function getWorldEntrySubtitleOverrides(
  definition: IWorldFieldDefinition | undefined,
  overrides: readonly { value: string; fieldDefinitionId: string }[],
  fieldDefinitions: Readonly<Record<string, IWorldFieldDefinition>>,
): WorldEntrySubtitleOverride[] {
  if (!definition || !canWorldSubtitleFieldHaveOverrides(definition)) return [];
  return overrides.flatMap(({ value, fieldDefinitionId }) => {
    const field = fieldDefinitions[fieldDefinitionId];
    return field && field.categoryId === definition.categoryId
      ? [{ value, field }]
      : [];
  });
}

export function normalizeWorldSubtitleValue(value: string): string {
  return value.trim().toLocaleLowerCase();
}

/**
 * The text a list shows under an entry's name: its category's subtitle field,
 * when that field applies to the entry. When the entry's subtitle value has
 * an override, the override's field shows instead, falling back to the
 * subtitle field while it shows nothing (empty, hidden by a rule, or
 * unreadable to this reader). Linked entries show the names of the ones this
 * client can read.
 */
export function getWorldEntrySubtitle(
  definition: IWorldFieldDefinition | undefined,
  entryId: string,
  snapshots: WorldFieldEntrySnapshots,
  entries: Readonly<Record<string, Pick<IWorldEntry, "name">>>,
  overrides: readonly WorldEntrySubtitleOverride[] = [],
): string | undefined {
  if (!definition) return undefined;
  const snapshot = getWorldFieldSnapshot(entryId, snapshots);
  if (!snapshot || !resolveFieldDefinition(definition, snapshot).visible)
    return undefined;
  const value = snapshot.entry.values[definition.id];
  const single = Array.isArray(value) && value.length === 1 ? value[0] : value;
  const override =
    typeof single === "string" && single.trim()
      ? overrides.find(
          (candidate) =>
            normalizeWorldSubtitleValue(candidate.value) ===
            normalizeWorldSubtitleValue(single),
        )
      : undefined;
  if (override && resolveFieldDefinition(override.field, snapshot).visible) {
    const text = getWorldFieldDisplayText(
      override.field,
      snapshot.entry.values[override.field.id],
      entries,
    );
    if (text) return text;
  }
  return getWorldFieldDisplayText(definition, value, entries);
}

/**
 * A field value as one line of text: list values joined by commas, and
 * linked entries as the names of the ones this client can read. Undefined
 * when nothing readable is left.
 */
export function getWorldFieldDisplayText(
  definition: Pick<IWorldFieldDefinition, "type" | "configuration">,
  value: unknown,
  entries: Readonly<Record<string, Pick<IWorldEntry, "name">>>,
): string | undefined {
  const values = (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === "string" && !!item.trim(),
  );
  let parts: string[];
  switch (getWorldFieldKind(definition)) {
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
