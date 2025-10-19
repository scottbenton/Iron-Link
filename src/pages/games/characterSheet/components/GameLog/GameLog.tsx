import { Box, LinearProgress } from "@mui/material";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";
import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useUID } from "stores/auth.store";
import { GamePermission } from "stores/game.store";
import { useGameLogStore } from "stores/gameLog.store";

import { GameLogEntry } from "./GameLogEntry";
import { GameLogMessageInput } from "./GameLogMessageInput";

interface GameLogProps {
  open: boolean;
}

export function GameLog(props: GameLogProps) {
  const { open } = props;

  const loading = useGameLogStore((state) => state.loading);
  const error = useGameLogStore((state) => state.error);
  const logs = useGameLogStore((state) => state.logs);

  const loadMoreLogs = useGameLogStore((state) => state.loadMoreLogsIfPresent);

  const { t } = useTranslation();

  const orderedLogs = useMemo(() => {
    return Object.entries(logs).sort(
      ([, l1], [, l2]) => l2.timestamp.getTime() - l1.timestamp.getTime(),
    );
  }, [logs]);

  const updateLastSeenLogDate = useGameLogStore(
    (state) => state.updateLastSeenLogDate,
  );
  const gameId = useGameId();
  const uid = useUID();

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

  useEffect(() => {
    const tabPanel = document.getElementById("tabpanel-game-log");
    const loadMoreLogsElement = document.getElementById("load-more-logs");

    // use intersection observer to load more logs
    if (tabPanel && loadMoreLogsElement) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadMoreLogs();
            }
          });
        },
        { threshold: 0.5 },
      );

      observer.observe(loadMoreLogsElement);

      return () => {
        observer.disconnect();
      };
    }
  }, [loadMoreLogs]);

  const isPlayer =
    useGamePermissions().gamePermission !== GamePermission.Viewer;
  return (
    <>
      {isPlayer && <GameLogMessageInput />}
      <Box flexShrink={0} height={"1px"} style={{ overflowAnchor: "auto" }} />
      {orderedLogs.map(([logId, log]) => (
        <GameLogEntry key={logId} logId={logId} log={log} />
      ))}
      <div id={"load-more-logs"} />
      {loading && <LinearProgress sx={{ flexShrink: 0 }} />}
      {error && !orderedLogs.length && (
        <EmptyState message={t("game.log.load-error", "Error loading logs")} />
      )}
      {orderedLogs.length === 0 && !loading && !error && (
        <EmptyState message={t("game.log.no-logs", "No logs yet")} />
      )}
    </>
  );
}
