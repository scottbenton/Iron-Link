import { useCallback, useEffect, useRef, useState } from "react";

/** A track's boxes, or a clock's (or tension clock's) filled segments. */
export type PendingTrackField = "ticks" | "segments";

/** How long a track waits after its last click before it saves. */
export const PENDING_TRACK_SAVE_DELAY_MS = 2000;

type PendingValues = Record<string, number>;

const keyOf = (id: string, field: PendingTrackField) => `${id}:${field}`;

export interface PendingTrackValues {
  /** The value to show: the one still waiting to save, else the saved one. */
  valueOf: (id: string, field: PendingTrackField, saved: number) => number;
  /** Shows a new value at once and saves it once clicks stop. */
  change: (id: string, field: PendingTrackField, value: number) => void;
  /** Shows a new value and saves it straight away (a roll, not a click). */
  changeNow: (id: string, field: PendingTrackField, value: number) => void;
}

/**
 * Keeps each track's and clock's latest click on screen while it waits to
 * save, so clicks show at once and stack up instead of each waiting for the
 * server. A value saves once its clicks stop for
 * `PENDING_TRACK_SAVE_DELAY_MS`, or straight away when the page leaves. It
 * stays on screen until the saved value matches it; a failed save drops it,
 * showing the saved value again.
 */
export function usePendingTrackValues(
  save: (
    id: string,
    field: PendingTrackField,
    value: number,
  ) => Promise<unknown>,
  saved: (id: string, field: PendingTrackField) => number | undefined,
  delay = PENDING_TRACK_SAVE_DELAY_MS,
): PendingTrackValues {
  const [pending, setPending] = useState<PendingValues>({});
  // Values not yet sent, by key, with their timers.
  const unsent = useRef(
    new Map<string, { value: number; timer: ReturnType<typeof setTimeout> }>(),
  );
  const saveRef = useRef(save);
  saveRef.current = save;

  const drop = useCallback((key: string, value: number) => {
    setPending((prev) => {
      if (prev[key] !== value) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const send = useCallback(
    (key: string, value: number) => {
      const entry = unsent.current.get(key);
      if (entry) clearTimeout(entry.timer);
      unsent.current.delete(key);
      const [id, field] = key.split(":") as [string, PendingTrackField];
      saveRef.current(id, field, value).catch(() => drop(key, value));
    },
    [drop],
  );

  const change = useCallback(
    (id: string, field: PendingTrackField, value: number) => {
      const key = keyOf(id, field);
      const entry = unsent.current.get(key);
      if (entry) clearTimeout(entry.timer);
      unsent.current.set(key, {
        value,
        timer: setTimeout(() => send(key, value), delay),
      });
      setPending((prev) => ({ ...prev, [key]: value }));
    },
    [delay, send],
  );

  const changeNow = useCallback(
    (id: string, field: PendingTrackField, value: number) => {
      const key = keyOf(id, field);
      setPending((prev) => ({ ...prev, [key]: value }));
      send(key, value);
    },
    [send],
  );

  // Once the saved value catches up, the pending one has done its job.
  useEffect(() => {
    Object.entries(pending).forEach(([key, value]) => {
      if (unsent.current.has(key)) return;
      const [id, field] = key.split(":") as [string, PendingTrackField];
      if (saved(id, field) === value) drop(key, value);
    });
  });

  // Leaving the page saves whatever is still waiting.
  useEffect(() => {
    const waiting = unsent.current;
    return () => {
      waiting.forEach(({ value, timer }, key) => {
        clearTimeout(timer);
        const [id, field] = key.split(":") as [string, PendingTrackField];
        saveRef.current(id, field, value).catch(() => {});
      });
      waiting.clear();
    };
  }, []);

  const valueOf = useCallback(
    (id: string, field: PendingTrackField, savedValue: number) =>
      pending[keyOf(id, field)] ?? savedValue,
    [pending],
  );

  return { valueOf, change, changeNow };
}
