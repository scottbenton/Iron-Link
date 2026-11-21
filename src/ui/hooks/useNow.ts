import { useSyncExternalStore } from "react";

/** How often the shared clock ticks, in milliseconds. */
export const NOW_TICK_MS = 30_000;

// One clock for the whole page. It ticks on a single interval, and only while
// something reads it, so a page full of relative times costs one timer, and
// each tick re-renders only the components that read the clock.
let now = Date.now();
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function tick() {
  now = Date.now();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === undefined) timer = setInterval(tick, NOW_TICK_MS);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function getSnapshot() {
  // While stopped the clock goes stale; the first reader after a pause
  // brings it up to date (or back, if the system clock was set back). It
  // moves at most once a tick, so React's repeated reads during one render
  // agree.
  if (timer === undefined && Math.abs(Date.now() - now) >= NOW_TICK_MS) {
    now = Date.now();
  }
  return now;
}

/**
 * The current time in milliseconds, from a clock shared by every caller that
 * moves forward every 30 seconds. Only the component that calls it re-renders
 * on a tick, so put it in the smallest piece that shows the time (a relative
 * time label), not in the list around it.
 */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
