import { Box, LinearProgress } from "@mui/material";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";

import { useGameLogStore } from "stores/gameLog.store";

import { GameLogEntry } from "./GameLogEntry";

export function GameLog() {
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

  return (
    <>
      <Box flexShrink={0} height={"1px"} style={{ overflowAnchor: "auto" }} />
      {orderedLogs.map(([logId, log]) => (
        <GameLogEntry key={logId} logId={logId} log={log} />
      ))}
      <div id={"load-more-logs"} />
      {loading && <LinearProgress sx={{ flexShrink: 0 }} />}
      {error && !orderedLogs.length && (
        <EmptyState
          message={t("game.log.load-error", "Error loading logs")}
          sx={{ flexGrow: 1 }}
        />
      )}
      {orderedLogs.length === 0 && !loading && !error && (
        <EmptyState
          message={t("game.log.no-logs", "No logs yet")}
          sx={{ flexGrow: 1 }}
        />
      )}
    </>
  );
}
