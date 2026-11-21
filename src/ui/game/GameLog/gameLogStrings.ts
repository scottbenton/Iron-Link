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
  /** Who sent a message from someone else's character: "sent by Kira". */
  sentBy: (name: string) => string;
  /** Who rolled for someone else's character: "rolled by Kira". */
  rolledBy: (name: string) => string;
  /** An entry's author with who wrote it: "Kai, rolled by Kira". */
  authorWrittenBy: (name: string, writtenBy: string) => string;
  /** Read before an entry: "Kai, 8:42 PM". */
  entryHeading: (author: string, time: string) => string;
  /** The heading of a Guide only entry: "Kai, 8:42 PM, Guide only". */
  guideOnlyHeading: (heading: string) => string;
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
    sentBy: (name) => t("ui.game-log.sent-by", "sent by {{name}}", { name }),
    rolledBy: (name) =>
      t("ui.game-log.rolled-by", "rolled by {{name}}", { name }),
    authorWrittenBy: (name, writtenBy) =>
      t("ui.game-log.author-written-by", "{{name}}, {{writtenBy}}", {
        name,
        writtenBy,
      }),
    entryHeading: (author, time) =>
      t("ui.game-log.entry-heading", "{{author}}, {{time}}", { author, time }),
    guideOnlyHeading: (heading) =>
      t("ui.game-log.guide-only-heading", "{{heading}}, Guide only", {
        heading,
      }),
  };
}
