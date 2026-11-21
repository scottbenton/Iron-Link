import type { GameLogAuthor } from "./GameLog";
import type { GameLogStrings } from "./gameLogStrings";

/**
 * Who wrote an entry and when, read with the entry as one piece of text:
 * "Kai, rolled by Kira, 8:42 PM, Guide only". The game log reads it before
 * each roll and message; the name and time shown around them are hidden.
 */
export function getGameLogHeading(
  entry: {
    author: Pick<GameLogAuthor, "name" | "writtenBy">;
    guideOnly?: boolean;
  },
  time: string,
  strings: Pick<
    GameLogStrings,
    "authorWrittenBy" | "entryHeading" | "guideOnlyHeading"
  >,
): string {
  const { name, writtenBy } = entry.author;
  const author = writtenBy ? strings.authorWrittenBy(name, writtenBy) : name;
  const heading = strings.entryHeading(author, time);
  return entry.guideOnly ? strings.guideOnlyHeading(heading) : heading;
}
