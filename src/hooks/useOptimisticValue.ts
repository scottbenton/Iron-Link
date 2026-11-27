import { useCallback, useEffect, useRef, useState } from "react";

interface Pending<Value> {
  value: Value;
  /** The saved value when this change was made. */
  base: Value;
}

/**
 * Shows a change at once instead of waiting for the save to come back.
 *
 * The new value stays on screen until the saved value changes (the save
 * landing, or someone else's change arriving first, which wins), and a
 * failed save drops it so the saved value shows again. Saves straight away;
 * for rapid repeated clicks, debounce the save as tracks do.
 */
export function useOptimisticValue<Value>(
  saved: Value,
  save: ((value: Value) => Promise<unknown>) | undefined,
): [Value, ((value: Value) => void) | undefined] {
  const [pending, setPending] = useState<Pending<Value>>();
  const savedRef = useRef(saved);
  savedRef.current = saved;

  useEffect(() => {
    if (pending && saved !== pending.base) setPending(undefined);
  }, [saved, pending]);

  const change = useCallback(
    (value: Value) => {
      if (!save) return;
      const next = { value, base: savedRef.current };
      setPending(next);
      save(value).catch(() =>
        setPending((current) => (current === next ? undefined : current)),
      );
    },
    [save],
  );

  return [pending ? pending.value : saved, save ? change : undefined];
}
