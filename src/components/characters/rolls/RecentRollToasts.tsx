import { useEffect, useRef } from "react";

import { toast } from "ui/components/Toast";
import { RollCard } from "ui/game/RollCard";

import { useIsActiveRollCardHost } from "stores/appState.store";

import { clearRecentRoll } from "./clearRecentRoll";
import { useRecentRollCards } from "./useRecentRollCards";

/**
 * The page's place for the recent roll cards: each a toast, stacked with the
 * app's other notifications. They step aside while a phone's activity dock
 * or an MUI dialog shows the cards instead (`useIsActiveRollCardHost`), and
 * come back after. Dismissing a card, or Clear All, clears the roll.
 */
export function RecentRollToasts() {
  const isActive = useIsActiveRollCardHost(true);
  const cards = useRecentRollCards();

  // Each card's toast while shown. A toast taken down here, rather than by
  // the person, must not clear its roll: the roll is only shown elsewhere.
  const shown = useRef(new Map<string, string>());
  const takenDown = useRef(new Set<string>());
  // A new toast id each time the cards come back, so a toast still leaving
  // is never revived halfway through its exit.
  const generation = useRef(0);

  useEffect(() => {
    const wanted = isActive ? cards : [];
    const wantedIds = new Set(wanted.map((card) => card.id));
    for (const [cardId, toastId] of shown.current) {
      if (wantedIds.has(cardId)) continue;
      shown.current.delete(cardId);
      // A roll cleared already needs no guard: clearing it again does
      // nothing. One only stepping aside keeps its roll.
      if (!isActive) takenDown.current.add(toastId);
      toast.dismiss(toastId);
    }
    if (!isActive) generation.current += 1;

    for (const card of wanted) {
      const toastId =
        shown.current.get(card.id) ??
        `recent-roll:${generation.current}:${card.id}`;
      shown.current.set(card.id, toastId);
      toast.custom(
        ({ dismiss }) => (
          <RollCard
            roll={card.roll}
            actions={card.actions}
            dismissLabel={card.dismissLabel}
            onDismiss={dismiss}
            elevated
          />
        ),
        {
          id: toastId,
          onDismiss: () => {
            if (takenDown.current.delete(toastId)) return;
            clearRecentRoll(card.id);
          },
        },
      );
    }
  });

  // Leaving the page (or Strict Mode's rehearsal) takes the toasts down
  // without clearing the rolls.
  useEffect(() => {
    const shownToasts = shown.current;
    const takenDownToasts = takenDown.current;
    return () => {
      for (const toastId of shownToasts.values()) {
        takenDownToasts.add(toastId);
        toast.dismiss(toastId);
      }
      shownToasts.clear();
      generation.current += 1;
    };
  }, []);

  return null;
}
