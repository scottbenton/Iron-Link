import { useTranslation } from "react-i18next";

import { ActivityDock } from "ui/game/ActivityDock";

import {
  useAppState,
  useIsActiveRollCardHost,
  useSetAnnouncement,
} from "stores/appState.store";

import { clearRecentRoll } from "./clearRecentRoll";
import { useRecentRollCards } from "./useRecentRollCards";

export interface DockedRecentRollsProps {
  /** Whether a modal is open over the page; the dock stays above it. */
  aboveModals: boolean;
}

/**
 * The docked cards themselves, fixed where `RecentRollsDock` measured
 * (its `--dock-*` properties).
 */
export function DockedRecentRolls(props: DockedRecentRollsProps) {
  const { aboveModals } = props;
  const { t } = useTranslation();
  const isActive = useIsActiveRollCardHost();
  const cards = useRecentRollCards();
  const clearAll = useAppState((state) => state.clearAllRolls);
  const announce = useSetAnnouncement();

  if (!isActive) return null;

  return (
    <ActivityDock
      css={{
        position: "fixed",
        left: "var(--dock-left)",
        right: "var(--dock-right)",
        bottom: "var(--dock-bottom)",
        // Under the page's popovers and drawers, its own sheet among them.
        zIndex: "sticky",
        width: "auto",
        maxWidth: "calc(40rem - 2 * token(spacing.4))",
        marginInline: "auto",
      }}
      items={cards.map((card) => ({
        id: card.id,
        roll: card.roll,
        actions: card.actions,
        dismissLabel: card.dismissLabel,
      }))}
      aboveModals={aboveModals}
      onDismiss={clearRecentRoll}
      onClearAll={() => {
        clearAll();
        announce(t("datasworn.roll-card.cleared", "Cleared recent rolls"));
      }}
      label={t("datasworn.roll-card.recent-rolls", "Recent rolls")}
      countLabel={(count) =>
        t("datasworn.roll-card.count", "{{count}} recent rolls", {
          count,
          defaultValue_one: "{{count}} recent roll",
        })
      }
      emptyLabel={t("datasworn.roll-card.empty", "No recent rolls")}
    />
  );
}
