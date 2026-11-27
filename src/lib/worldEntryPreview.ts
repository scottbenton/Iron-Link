import type { IWorldFieldDefinition } from "types/worldField.type";

import type { IWorldEntry } from "services/worldEntries.service";
import type { IWorldEntryFieldValue } from "services/worldEntryFieldValues.service";

import { getWorldFieldDisplayText } from "./worldEntrySubtitle";

// How many fields an entry's hover card shows before it would stop being a
// glance.
export const WORLD_ENTRY_PREVIEW_FIELD_LIMIT = 4;

export interface WorldEntryPreviewField {
  id: string;
  label: string;
  text: string;
}

/**
 * The fields an entry's hover card shows: the first few, in order, that hold
 * something this reader can see. `fields` are already resolved and filtered
 * for the reader (Guide-only and hidden fields left out).
 */
export function getWorldEntryPreviewFields(
  fields: readonly Pick<
    IWorldFieldDefinition,
    "id" | "label" | "type" | "configuration"
  >[],
  values: Readonly<Record<string, Pick<IWorldEntryFieldValue, "value">>>,
  entries: Readonly<Record<string, Pick<IWorldEntry, "name">>>,
  limit = WORLD_ENTRY_PREVIEW_FIELD_LIMIT,
): WorldEntryPreviewField[] {
  const preview: WorldEntryPreviewField[] = [];
  for (const field of fields) {
    if (preview.length >= limit) break;
    const text = getWorldFieldDisplayText(
      field,
      values[field.id]?.value,
      entries,
    );
    if (text) preview.push({ id: field.id, label: field.label, text });
  }
  return preview;
}
