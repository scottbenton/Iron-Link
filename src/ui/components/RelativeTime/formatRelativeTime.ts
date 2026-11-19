/**
 * "Just now", "5 minutes ago", "2 hours ago", "yesterday", in the reader's
 * language. Returns undefined for a time in the future (a clock ahead of the
 * reader's), so the caller shows the absolute time instead.
 */
export function formatRelativeTime(
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
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return format.format(-hours, "hour");
  return format.format(-Math.floor(hours / 24), "day");
}
