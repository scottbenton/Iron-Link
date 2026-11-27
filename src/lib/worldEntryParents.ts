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

type NamedParentLinkedEntry = ParentLinkedEntry & Pick<IWorldEntry, "name">;

/**
 * The entry's ancestors this client can see, outermost first. The walk stops
 * at a parent that is hidden or missing, and at a repeat in existing bad data.
 */
export function getWorldEntryAncestors<T extends ParentLinkedEntry>(
  entries: Readonly<Record<string, T>>,
  entryId: string,
): T[] {
  const ancestors: T[] = [];
  const visited = new Set<string>([entryId]);
  let parentId = entries[entryId]?.parentEntryId ?? null;
  while (parentId && !visited.has(parentId)) {
    const parent = entries[parentId];
    if (!parent) break;
    ancestors.unshift(parent);
    visited.add(parentId);
    parentId = parent.parentEntryId;
  }
  return ancestors;
}

/**
 * Whether an entry sits at its category's top level for this client: it has
 * no parent, or its parent is hidden, so it would otherwise be unreachable.
 */
export function isTopLevelWorldEntry(
  entries: Readonly<Record<string, ParentLinkedEntry>>,
  entry: ParentLinkedEntry,
): boolean {
  return !entry.parentEntryId || !entries[entry.parentEntryId];
}

/** How many visible entries sit directly inside each entry. */
export function countWorldEntryChildren(
  entries: Readonly<Record<string, ParentLinkedEntry>>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  Object.values(entries).forEach((entry) => {
    if (entry.parentEntryId && entries[entry.parentEntryId]) {
      counts[entry.parentEntryId] = (counts[entry.parentEntryId] ?? 0) + 1;
    }
  });
  return counts;
}

/** The names of an entry's visible ancestors, as a path. */
export function getWorldEntryPath(
  entries: Readonly<Record<string, NamedParentLinkedEntry>>,
  entryId: string,
): string {
  return getWorldEntryAncestors(entries, entryId)
    .map((ancestor) => ancestor.name)
    .join(" / ");
}

export interface WorldEntryTree<T> {
  /** Entries at the category's top level for this client, by name. */
  roots: T[];
  /** The visible entries directly inside each entry, by name. */
  children: Record<string, T[]>;
}

/**
 * A category's entries as a tree, each level by name. Entries whose parent
 * this client cannot see sit at the top level. Existing bad data may hold a
 * loop, so a drawer of the tree must still draw each entry once.
 */
export function getWorldEntryTree<T extends NamedParentLinkedEntry>(
  entries: Readonly<Record<string, T>>,
  categoryId: string,
): WorldEntryTree<T> {
  const inCategory = Object.values(entries)
    .filter((entry) => entry.categoryId === categoryId)
    .sort((a, b) => a.name.localeCompare(b.name));
  const children: Record<string, T[]> = {};
  const roots: T[] = [];
  for (const entry of inCategory) {
    const parentId = entry.parentEntryId;
    if (parentId && entries[parentId]?.categoryId === categoryId) {
      (children[parentId] ??= []).push(entry);
    } else {
      roots.push(entry);
    }
  }
  return { roots, children };
}
