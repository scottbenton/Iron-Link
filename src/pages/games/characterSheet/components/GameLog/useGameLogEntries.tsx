import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useRollCardActions } from "components/characters/rolls/useRollCardActions";

import type { GameLogEntry } from "ui/game/GameLog";
import { getDefaultGameLogStrings } from "ui/game/GameLog";
import { Box } from "ui/primitives";

import { getRollSummaryNames } from "hooks/useRollSummary";

import { useUID } from "stores/auth.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useGameLogStore } from "stores/gameLog.store";
import { useUserNames } from "stores/users.store";

import { toRollData } from "lib/rollSummary.lib";

import { LogType } from "services/gameLog.service";

import { getGameLogAuthor } from "./gameLogAuthor";
import { renderMessageHtml } from "./renderMessageHtml";

const messageStyles = {
  whiteSpace: "normal",
  "& p, & ul, & ol, & pre, & blockquote": { margin: 0 },
  "& > * + *": { marginBlockStart: "1" },
  "& ul, & ol": { paddingInlineStart: "5" },
  "& a": { color: "accent.fg", textDecoration: "underline" },
} as const;

/**
 * The game's log as the library's entries, oldest first: who wrote each,
 * each roll's card with the actions this person may take on it, and each
 * message's text.
 */
export function useGameLogEntries(): GameLogEntry[] {
  const { t } = useTranslation();
  const uid = useUID();
  const logs = useGameLogStore((state) => state.logs);
  const characters = useGameCharactersStore((state) => state.characters);
  const getActions = useRollCardActions();

  const uids = useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(logs).flatMap((log) => (log.uid ? [log.uid] : [])),
        ),
      ).sort(),
    [logs],
  );
  const userNames = useUserNames(uids);

  const strings = getDefaultGameLogStrings(t);
  const loadingName = t("common.loading", "Loading");
  const deletedName = t("common.deleted-user", "Deleted User");

  return Object.entries(logs)
    .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime())
    .map(([logId, log]): GameLogEntry => {
      const character = log.characterId
        ? characters[log.characterId]
        : undefined;
      const author = getGameLogAuthor({
        log,
        uid,
        // A character that isn't loaded (or was deleted) reads as its player.
        characterName: character ? character.name : undefined,
        characterOwnerId: character?.uid,
        creatorName: log.uid
          ? (userNames[log.uid] ?? loadingName)
          : deletedName,
        loadingName,
        strings,
      });
      const base = {
        id: logId,
        author: { ...author, id: log.characterId ?? log.uid ?? undefined },
        timestamp: log.timestamp,
      };

      if (log.logType === LogType.MESSAGE) {
        return {
          ...base,
          kind: "message",
          message: (
            <Box css={messageStyles}>{renderMessageHtml(log.contents)}</Box>
          ),
        };
      }
      return {
        ...base,
        kind: "roll",
        roll: toRollData(log, getRollSummaryNames(log)),
        actions: getActions(logId, log),
      };
    });
}
