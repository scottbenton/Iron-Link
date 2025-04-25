import { ProgressBar } from "@/components/common/ProgressBar";
import { EmptyState } from "@/components/layout/EmptyState";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGameLogStore } from "@/stores/gameLog.store";
import { Box } from "@chakra-ui/react";
import { useEffect } from "react";

import { LogEntry } from "./LogEntry";

export function GameLog() {
  const t = useGameTranslations();

  const loading = useGameLogStore((store) => store.loading);
  const error = useGameLogStore((store) => store.error);
  const orderedLogIds = useGameLogStore((store) =>
    Object.entries(store.logs)
      .sort(([, l1], [, l2]) => l1.timestamp.getTime() - l2.timestamp.getTime())
      .map(([id]) => id),
  );

  const loadMoreLogs = useGameLogStore((state) => state.loadMoreLogsIfPresent);
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
      <Box flexShrink={0} h={"1px"} style={{ overflowAnchor: "auto" }} />
      {orderedLogIds.map((logId, index, logs) => (
        <LogEntry
          logId={logId}
          priorLogId={index > 0 ? logs[index - 1] : undefined}
          key={logId}
        />
      ))}

      <div id={"load-more-logs"} />
      {loading && <ProgressBar flexShrink={0} />}
      {error && !orderedLogIds.length && (
        <EmptyState message={t("game.log.load-error", "Error loading logs")} />
      )}
      {orderedLogIds.length === 0 && !loading && !error && (
        <EmptyState message={t("game.log.no-logs", "No logs yet")} />
      )}
    </>
  );
}
