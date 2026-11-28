import { useCallback, useEffect, useRef, useState } from "react";

import {
  AssetCardState,
  AssetControl,
  AssetControlValue,
} from "ui/game/AssetCard";

/** How long a clock waits for more clicks before it saves. */
export const CLOCK_SAVE_DELAY_MS = 2000;

/**
 * Holds a clock's clicks for two seconds before saving them, so filling
 * four segments is one write, not four.
 * Every other control saves at once. A held value shows straight away and is
 * saved when the card unmounts.
 */
export function useDebouncedClockChanges(
  state: AssetCardState | undefined,
  controls: Record<string, AssetControl>,
  onControlChange:
    | ((key: string, value: AssetControlValue) => void)
    | undefined,
): {
  state: AssetCardState | undefined;
  onControlChange:
    | ((key: string, value: AssetControlValue) => void)
    | undefined;
} {
  const [pending, setPending] = useState<Record<string, AssetControlValue>>({});
  const pendingRef = useRef(pending);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const saveRef = useRef(onControlChange);
  saveRef.current = onControlChange;

  const flush = useCallback((key: string) => {
    clearTimeout(timers.current[key]);
    delete timers.current[key];
    if (!(key in pendingRef.current)) return;
    const { [key]: value, ...rest } = pendingRef.current;
    pendingRef.current = rest;
    setPending(rest);
    saveRef.current?.(key, value);
  }, []);

  useEffect(
    () => () => {
      Object.keys(pendingRef.current).forEach((key) => {
        clearTimeout(timers.current[key]);
        saveRef.current?.(key, pendingRef.current[key]);
      });
      pendingRef.current = {};
    },
    [],
  );

  const change = useCallback(
    (key: string, value: AssetControlValue) => {
      if (controls[key]?.field_type !== "clock") {
        saveRef.current?.(key, value);
        return;
      }
      pendingRef.current = { ...pendingRef.current, [key]: value };
      setPending(pendingRef.current);
      clearTimeout(timers.current[key]);
      timers.current[key] = setTimeout(() => flush(key), CLOCK_SAVE_DELAY_MS);
    },
    [controls, flush],
  );

  const shownState =
    Object.keys(pending).length > 0
      ? {
          ...state,
          controlValues: { ...state?.controlValues, ...pending },
        }
      : state;

  return {
    state: shownState,
    onControlChange: onControlChange ? change : undefined,
  };
}
