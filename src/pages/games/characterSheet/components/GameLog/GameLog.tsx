import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "ui/components/Alert";
import { GameLog as GameLogView } from "ui/game/GameLog";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";
import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useUID } from "stores/auth.store";
import { GamePermission } from "stores/game.store";
import { useGameLogStore } from "stores/gameLog.store";

import { createId } from "lib/id.lib";

import { IMessage, LogType } from "services/gameLog.service";

import { useCharacterIdOptional } from "../../hooks/useCharacterId";
import { plainTextToMessageHtml } from "./plainTextToMessageHtml";
import { useGameLogEntries } from "./useGameLogEntries";

interface GameLogProps {
  /** The log is on screen: it counts as seen from opening to closing. */
  open: boolean;
}

/**
 * The game's log of rolls and messages, newest at the bottom, with a
 * message field for players (not viewers) and earlier entries a button
 * press away.
 */
export function GameLog(props: GameLogProps) {
  const { open } = props;
  const { t } = useTranslation();

  const loading = useGameLogStore((state) => state.loading);
  const error = useGameLogStore((state) => state.error);
  const hasHitEndOfList = useGameLogStore((state) => state.hasHitEndOfList);
  const loadMoreLogs = useGameLogStore((state) => state.loadMoreLogsIfPresent);
  const createLog = useGameLogStore((state) => state.createLog);
  const updateLastSeenLogDate = useGameLogStore(
    (state) => state.updateLastSeenLogDate,
  );

  const gameId = useGameId();
  const uid = useUID();
  const characterId = useCharacterIdOptional();
  const entries = useGameLogEntries();

  useEffect(() => {
    if (!uid) return;

    function handleVisibilityChange() {
      if (open && document.hidden && uid) {
        updateLastSeenLogDate(gameId, uid).catch(() => {});
      }
    }

    if (open) {
      updateLastSeenLogDate(gameId, uid).catch(() => {});
      window.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        updateLastSeenLogDate(gameId, uid).catch(() => {});
        window.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [open, updateLastSeenLogDate, uid, gameId]);

  const isPlayer =
    useGamePermissions().gamePermission !== GamePermission.Viewer;

  const sendMessage = async (text: string) => {
    if (!uid) return;
    const message: IMessage = {
      id: createId(),
      logType: LogType.MESSAGE,
      guidesOnly: false,
      uid,
      gameId,
      characterId: characterId || null,
      contents: plainTextToMessageHtml(text),
      timestamp: new Date(),
    };
    await createLog(message.id, message);
  };

  if (error && entries.length === 0) {
    return (
      <Alert tone="danger" css={{ margin: "3" }}>
        {t("game.log.load-error", "Error loading logs")}
      </Alert>
    );
  }

  return (
    <GameLogView
      entries={entries}
      loading={loading}
      hasMore={!hasHitEndOfList}
      onLoadMore={loadMoreLogs}
      onSend={isPlayer ? sendMessage : undefined}
    />
  );
}
