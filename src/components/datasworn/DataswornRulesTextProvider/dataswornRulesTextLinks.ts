import { getDataswornItem } from "components/datasworn/DataswornDialog/useGetDataswornItem";

import type { LegacyIdMap } from "./legacyIdMap";

// Atlas entries have no page or dialog to open yet.
const UNOPENABLE_LINK_TYPES = ["atlas_entry"];

/**
 * The id a `datasworn:` link opens: its current id, for one from before 0.1
 * (while the map is still loading, the id as written).
 */
export function getDataswornLinkId(id: string, idMap?: LegacyIdMap): string {
  return idMap?.[id] ?? id;
}

/**
 * Whether a `datasworn:` link opens anything: the loaded rules have the item,
 * and it is a kind of item the app can show. Anything else reads as plain
 * text in its sentence.
 */
export function canOpenDataswornLink(id: string, idMap?: LegacyIdMap): boolean {
  if (UNOPENABLE_LINK_TYPES.some((type) => id.includes(type))) {
    return false;
  }
  return !!getDataswornItem(getDataswornLinkId(id, idMap));
}
