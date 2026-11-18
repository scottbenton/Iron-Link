/** Whether two dates fall on the same calendar day, in local time. */
export function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/**
 * "Just now", "5 minutes ago", "2 hours ago", in the reader's language.
 * Returns undefined where a relative time would mislead: before today, where
 * the day separator already names the day, or in the future (a clock ahead
 * of the reader's), so the caller shows the clock time.
 */
export function formatGameLogRelativeTime(
  date: Date,
  now: Date,
  justNow: string,
): string | undefined {
  const seconds = (now.getTime() - date.getTime()) / 1000;
  if (seconds < -60) return undefined;
  if (seconds < 60) return justNow;
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return format.format(-minutes, "minute");
  if (!sameDay(date, now)) return undefined;
  return format.format(-Math.floor(minutes / 60), "hour");
}
