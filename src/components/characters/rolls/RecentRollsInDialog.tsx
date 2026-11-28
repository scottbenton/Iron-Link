import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import { RollCard } from "ui/game/RollCard";
import { XIcon } from "ui/icons";
import { Stack } from "ui/primitives";

import {
  useAppState,
  useIsActiveRollCardHost,
  useSetAnnouncement,
} from "stores/appState.store";

import { clearRecentRoll } from "./clearRecentRoll";
import { useRecentRollCards } from "./useRecentRollCards";

/**
 * The recent roll cards inside an MUI dialog. An MUI dialog hides the rest
 * of the page from screen readers, toasts included, so while one is open its
 * own copy of the cards takes their place. Every dialog renders this through
 * `DialogExtrasContext`; only the newest shows anything. Library dialogs
 * leave the toasts reachable and need none.
 */
export function RecentRollsInDialog() {
  const { t } = useTranslation();
  const isActive = useIsActiveRollCardHost();
  const cards = useRecentRollCards();
  const clearAll = useAppState((state) => state.clearAllRolls);
  const announce = useSetAnnouncement();

  // Dismissing a card removes the button that had focus, so focus moves to
  // the next card's dismiss button (or the one before it) instead of being
  // lost.
  const dismissButtons = useRef(new Map<string, HTMLElement>());
  const pendingFocus = useRef<string | null>(null);
  useEffect(() => {
    const key = pendingFocus.current;
    if (key) {
      pendingFocus.current = null;
      dismissButtons.current.get(key)?.focus();
    }
  }, [cards]);

  const handleDismiss = (index: number) => {
    const next = cards[index + 1] ?? cards[index - 1];
    pendingFocus.current = next ? next.id : null;
    clearRecentRoll(cards[index].id);
  };

  if (!isActive || cards.length === 0) return null;

  return (
    <Stack
      as="section"
      aria-label={t("datasworn.roll-card.recent-rolls", "Recent rolls")}
      position="fixed"
      zIndex="toast"
      bottom="4"
      right="4"
      left="4"
      gap="2"
      alignItems="flex-end"
      pointerEvents="none"
      css={{ "& > *": { pointerEvents: "auto" } }}
    >
      {cards.map((card, index) => (
        <RollCard
          key={card.id}
          roll={card.roll}
          actions={card.actions}
          dismissLabel={card.dismissLabel}
          onDismiss={() => handleDismiss(index)}
          dismissButtonRef={(element: HTMLElement | null) => {
            if (element) dismissButtons.current.set(card.id, element);
            else dismissButtons.current.delete(card.id);
          }}
          elevated
          animateIn
        />
      ))}
      <Button
        size="sm"
        variant="outline"
        endIcon={<XIcon />}
        onClick={() => {
          clearAll();
          announce(t("datasworn.roll-card.cleared", "Cleared recent rolls"));
        }}
      >
        {t("datasworn.roll-card.clear-all", "Clear All")}
      </Button>
    </Stack>
  );
}
