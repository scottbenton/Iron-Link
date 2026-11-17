import { useCallback, useEffect, useRef } from "react";

import { VisibleRoll, useAppState } from "stores/appState.store";

/**
 * Dismissing a roll card removes the button that had focus, so focus moves to
 * the dismiss button of the next older card (or the newer one, when it was the
 * oldest) instead of being lost. With none left (after the last dismiss or
 * `clearAll`), `onEmpty` runs once the cards are gone.
 */
export function useRollDismissFocus(
  rolls: VisibleRoll[],
  onEmpty?: () => void,
) {
  const clearRoll = useAppState((state) => state.clearRoll);
  const clearAllRolls = useAppState((state) => state.clearAllRolls);

  const dismissButtons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocusKey = useRef<string | null | undefined>(undefined);
  const onEmptyRef = useRef(onEmpty);
  useEffect(() => {
    onEmptyRef.current = onEmpty;
  });

  useEffect(() => {
    const key = pendingFocusKey.current;
    if (key === undefined) return;
    pendingFocusKey.current = undefined;
    if (key) {
      dismissButtons.current.get(key)?.focus();
    } else {
      onEmptyRef.current?.();
    }
  }, [rolls]);

  // Reads the rolls as they are now: a card on its way out still holds the
  // handler from when it was shown.
  const dismiss = useCallback(
    (rollKey: string) => {
      const current = useAppState.getState().visibleRolls;
      const index = current.findIndex(({ roll }) => roll.id === rollKey);
      if (index < 0) return;
      const next = current[index - 1] ?? current[index + 1];
      pendingFocusKey.current = next ? next.roll.id : null;
      clearRoll(index);
    },
    [clearRoll],
  );

  const clearAll = useCallback(() => {
    if (useAppState.getState().visibleRolls.length === 0) return;
    pendingFocusKey.current = null;
    clearAllRolls();
  }, [clearAllRolls]);

  const getDismissButtonRef = useCallback(
    (rollKey: string) => (element: HTMLButtonElement | null) => {
      if (element) {
        dismissButtons.current.set(rollKey, element);
      } else {
        dismissButtons.current.delete(rollKey);
      }
    },
    [],
  );

  return { dismiss, clearAll, getDismissButtonRef };
}
