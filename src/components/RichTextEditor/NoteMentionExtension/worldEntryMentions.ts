import type { IWorldCategory } from "services/worldCategories.service";
import type { IWorldEntry } from "services/worldEntries.service";

export const WORLD_ENTRY_MENTION_LIMIT = 8;

export interface WorldEntryMentionCandidate {
  entry: IWorldEntry;
  category: IWorldCategory;
}

/**
 * The readable entries whose names contain the query, grouped by category in
 * the world's order, then by name. Readable means held by this client: the
 * entries listener only ever receives what row level security lets it read.
 */
export function findWorldEntryMentionCandidates(
  entries: Readonly<Record<string, IWorldEntry>>,
  categories: Readonly<Record<string, IWorldCategory>>,
  query: string,
  limit = WORLD_ENTRY_MENTION_LIMIT,
): WorldEntryMentionCandidate[] {
  const needle = query.trim().toLocaleLowerCase();
  return Object.values(entries)
    .flatMap((entry) => {
      const category = categories[entry.categoryId];
      if (!category) return [];
      if (needle && !entry.name.toLocaleLowerCase().includes(needle)) {
        return [];
      }
      return [{ entry, category }];
    })
    .sort(
      (a, b) =>
        a.category.sortOrder - b.category.sortOrder ||
        a.category.name.localeCompare(b.category.name) ||
        a.entry.name.localeCompare(b.entry.name),
    )
    .slice(0, limit);
}
