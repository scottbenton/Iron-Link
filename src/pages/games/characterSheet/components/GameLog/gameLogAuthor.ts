import type { GameLogAuthor } from "ui/game/GameLog/GameLog";
import type { GameLogStrings } from "ui/game/GameLog/gameLogStrings";

import { IGameLog, LogType } from "services/gameLog.service";

export interface GameLogAuthorInput {
  log: Pick<IGameLog, "uid" | "logType">;
  /** The signed in player. */
  uid: string | undefined;
  /**
   * The character the entry was written from: undefined for none (or not
   * loaded), null while its name loads.
   */
  characterName: string | null | undefined;
  characterOwnerId: string | undefined;
  /** The player who wrote the entry. */
  creatorName: string;
  /** Stands in for a character's name while it loads. */
  loadingName: string;
  strings: Pick<GameLogStrings, "sentBy" | "rolledBy">;
}

/**
 * Who wrote a game log entry, in the library's terms: the character (or the
 * player when there is none), who wrote it for the character's owner, and
 * whether it was the person viewing.
 */
export function getGameLogAuthor(input: GameLogAuthorInput): GameLogAuthor {
  const { log, uid, characterName, characterOwnerId, creatorName } = input;
  const name =
    characterName === undefined
      ? creatorName
      : (characterName ?? input.loadingName);

  // Someone other than the character's owner wrote this entry from its sheet.
  const wasWrittenForOwner = !!characterOwnerId && log.uid !== characterOwnerId;
  const writtenBy = wasWrittenForOwner
    ? log.logType === LogType.MESSAGE
      ? input.strings.sentBy(creatorName)
      : input.strings.rolledBy(creatorName)
    : undefined;

  return {
    name,
    ...(writtenBy ? { writtenBy } : {}),
    isYou: log.uid === uid,
  };
}
