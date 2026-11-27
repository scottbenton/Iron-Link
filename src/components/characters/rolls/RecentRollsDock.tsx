import { useTranslation } from "react-i18next";

import { ActivityDock } from "ui/game/ActivityDock";

import {
  useAppState,
  useIsActiveRollCardHost,
  useSetAnnouncement,
} from "stores/appState.store";

import { clearRecentRoll } from "./clearRecentRoll";
import { useRecentRollCards } from "./useRecentRollCards";

/**
 * The recent roll cards on a phone's game page, docked above the bottom
 * nav: the newest in full, the others behind it and in the sheet. While it
 * is mounted, it shows the cards in place of the page's toasts. Place it in
 * a positioned box at the page's foot (the bottom nav's): it sits just above
 * that box, 16px in from each side.
 */
export function RecentRollsDock() {
  const { t } = useTranslation();
  const isActive = useIsActiveRollCardHost();
  const cards = useRecentRollCards();
  const clearAll = useAppState((state) => state.clearAllRolls);
  const announce = useSetAnnouncement();

  if (!isActive) return null;

  return (
    <ActivityDock
      css={{
        position: "absolute",
        insetInline: "4",
        bottom: "calc(100% + token(spacing.3))",
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
