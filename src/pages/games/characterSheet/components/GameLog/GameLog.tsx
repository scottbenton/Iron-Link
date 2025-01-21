import { Box, LinearProgress } from "@mui/material";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";
import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { GamePermission } from "stores/game.store";
import { useGameLogStore } from "stores/gameLog.store";

import { GameLogEntry } from "./GameLogEntry";

export function GameLog() {
  const loading = useGameLogStore((state) => state.loading);
  const error = useGameLogStore((state) => state.error);
  const logs = useGameLogStore((state) => state.logs);

  const gameId = useGameId();
  const isGuide = useGamePermissions().gamePermission === GamePermission.Guide;
  const loadMoreLogs = useGameLogStore((state) => state.loadMoreLogsIfPresent);

  const { t } = useTranslation();

  const orderedLogs = useMemo(() => {
    return Object.entries(logs).sort(
      ([, l1], [, l2]) => l1.timestamp.getTime() - l2.timestamp.getTime(),
    );
  }, [logs]);

  useEffect(() => {
    const tabPanel = document.getElementById("tabpanel-game-log");
    const loadMoreLogsElement = document.getElementById("load-more-logs");

    // use intersection observer to load more logs
    if (tabPanel && loadMoreLogsElement) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadMoreLogs(gameId, isGuide);
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
  }, [loadMoreLogs, gameId, isGuide]);

  return (
    <Box flexGrow={1}>
      {loading && <LinearProgress />}
      <div id={"load-more-logs"} />
      {error && !orderedLogs.length && (
        <EmptyState message={t("game.log.load-error", "Error loading logs")} />
      )}
      {orderedLogs.length === 0 && !loading && !error && (
        <EmptyState message={t("game.log.no-logs", "No logs yet")} />
      )}
      {orderedLogs.map(([logId, log]) => (
        <GameLogEntry key={logId} logId={logId} log={log} />
      ))}
    </Box>
  );
}
