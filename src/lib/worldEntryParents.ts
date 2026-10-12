import type { IWorldEntry } from "services/worldEntries.service";

type ParentLinkedEntry = Pick<
  IWorldEntry,
  "id" | "categoryId" | "parentEntryId"
>;

/**
 * Mirrors the database's parent rules against the entries this client can
 * see: a parent must be another entry in the same category that is not one of
 * the entry's descendants. Clearing the parent is always valid. Whether the
 * category supports nesting is the caller's concern. Entries hidden from this
 * client can still complete a loop, so the server remains authoritative.
 */
export function isValidWorldEntryParent(
  entries: Readonly<Record<string, ParentLinkedEntry>>,
  entryId: string,
  parentEntryId: string | null,
): boolean {
  if (parentEntryId === null) return true;
  const entry = entries[entryId];
  const parent = entries[parentEntryId];
  if (!entry || !parent || parentEntryId === entryId) return false;
  if (parent.categoryId !== entry.categoryId) return false;
  // Existing bad data may already contain a loop; stop at the first repeat.
  const visited = new Set<string>();
  let ancestorId: string | null = parentEntryId;
  while (ancestorId && !visited.has(ancestorId)) {
    if (ancestorId === entryId) return false;
    visited.add(ancestorId);
    ancestorId = entries[ancestorId]?.parentEntryId ?? null;
  }
  return true;
}
