import { sameDay } from "./gameLogTime";

/**
 * Where an entry sits in a run of entries one author wrote close together:
 * alone, or the first, a middle or the last of a group. A group shows its
 * header once, at the top, and its time once, under the last entry.
 */
export type GameLogGroupPosition = "single" | "first" | "middle" | "last";

/** How long a pause still keeps one author's entries together. */
export const GAME_LOG_GROUP_WINDOW_MS = 5 * 60_000;

interface GroupableEntry {
  author: { id?: string; name: string; writtenBy?: string };
  timestamp: Date;
  guideOnly?: boolean;
}

/**
 * Whether `entry` carries on `previous`'s group: the same author (and the
 * same player writing for them), the same day, the same audience (a Guide
 * only entry is marked in its header), and no longer than `windowMs` after
 * it. A `windowMs` of 0 or less turns grouping off.
 */
function continues(
  previous: GroupableEntry,
  entry: GroupableEntry,
  windowMs: number,
): boolean {
  if (windowMs <= 0) return false;
  const gap = entry.timestamp.getTime() - previous.timestamp.getTime();
  return (
    (previous.author.id ?? previous.author.name) ===
      (entry.author.id ?? entry.author.name) &&
    previous.author.writtenBy === entry.author.writtenBy &&
    Boolean(previous.guideOnly) === Boolean(entry.guideOnly) &&
    sameDay(previous.timestamp, entry.timestamp) &&
    gap >= 0 &&
    gap <= windowMs
  );
}

/** Each entry's place in its group, in the order given (oldest first). */
export function getGameLogGroupPositions(
  entries: GroupableEntry[],
  windowMs: number = GAME_LOG_GROUP_WINDOW_MS,
): GameLogGroupPosition[] {
  return entries.map((entry, index) => {
    const previous = entries[index - 1];
    const next = entries[index + 1];
    const joinsPrevious = !!previous && continues(previous, entry, windowMs);
    const joinsNext = !!next && continues(entry, next, windowMs);
    if (joinsPrevious) return joinsNext ? "middle" : "last";
    return joinsNext ? "first" : "single";
  });
}
