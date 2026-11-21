import type { TFunction } from "i18next";

export interface GameLogStrings {
  emptyTitle: string;
  emptyText: string;
  guideOnly: string;
  loadEarlier: string;
  loading: string;
  today: string;
  yesterday: string;
  /** An entry from the last minute, in place of a relative time. */
  justNow: string;
  /** The log's name for screen readers. */
  label: string;
}

export function getDefaultGameLogStrings(t: TFunction): GameLogStrings {
  return {
    emptyTitle: t("ui.game-log.empty-title", "No rolls or messages yet"),
    emptyText: t(
      "ui.game-log.empty-text",
      "Rolls and messages from everyone in this game show up here.",
    ),
    guideOnly: t("ui.game-log.guide-only", "Guide only"),
    loadEarlier: t("ui.game-log.load-earlier", "Load Earlier Entries"),
    loading: t("ui.game-log.loading", "Loading entries"),
    today: t("ui.game-log.today", "Today"),
    yesterday: t("ui.game-log.yesterday", "Yesterday"),
    justNow: t("ui.relative-time.just-now", "Just now"),
    label: t("ui.game-log.label", "Game log"),
  };
}
