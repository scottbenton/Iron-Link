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

export const defaultGameLogStrings: GameLogStrings = {
  emptyTitle: "No rolls or messages yet",
  emptyText: "Rolls and messages from everyone in this game show up here.",
  guideOnly: "Guide only",
  loadEarlier: "Load Earlier Entries",
  loading: "Loading entries",
  today: "Today",
  yesterday: "Yesterday",
  justNow: "Just now",
  label: "Game log",
};
