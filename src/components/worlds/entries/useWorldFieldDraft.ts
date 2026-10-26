import deepEqual from "fast-deep-equal";
import { useCallback, useEffect, useRef, useState } from "react";

import type { WorldFieldValue } from "services/worldEntryFieldValues.service";

type Value = WorldFieldValue | null;

// How long a field waits after its last change before saving it.
export const WORLD_FIELD_SAVE_DELAY_MS = 1000;
// How long a saved change keeps showing if the stored value never matches it.
const CATCH_UP_TIMEOUT_MS = 10000;

/**
 * A field value that shows a change at once and saves it after a pause, like
 * the debounced fields elsewhere in the app, so rolling again and again sends
 * one save. The change keeps showing until the stored value matches it, so a
 * late realtime change from an earlier save never makes the field jump back.
 * A failed save shows the stored value again; leaving saves at once.
 */
export function useWorldFieldDraft(
  stored: Value,
  save: (value: Value) => Promise<void>,
): [Value, (value: Value) => void] {
  const [draft, setDraft] = useState<{ value: Value; sent: boolean }>();
  const pending = useRef<{
    value: Value;
    timeout: ReturnType<typeof setTimeout>;
  }>(undefined);
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  if (draft?.sent && deepEqual(stored, draft.value)) setDraft(undefined);

  const flush = useCallback(() => {
    const sending = pending.current;
    if (!sending) return;
    clearTimeout(sending.timeout);
    pending.current = undefined;
    const { value } = sending;
    const forget = () =>
      setDraft((current) => (current?.value === value ? undefined : current));
    setDraft((current) =>
      current?.value === value ? { value, sent: true } : current,
    );
    saveRef
      .current(value)
      .then(() => setTimeout(forget, CATCH_UP_TIMEOUT_MS), forget);
  }, []);
  useEffect(() => flush, [flush]);

  const change = useCallback(
    (value: Value) => {
      if (pending.current) clearTimeout(pending.current.timeout);
      pending.current = {
        value,
        timeout: setTimeout(flush, WORLD_FIELD_SAVE_DELAY_MS),
      };
      setDraft({ value, sent: false });
    },
    [flush],
  );

  return [draft ? draft.value : stored, change];
}
