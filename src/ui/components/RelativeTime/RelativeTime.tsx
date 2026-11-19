import { Tooltip } from "../Tooltip";
import { formatRelativeTime } from "./formatRelativeTime";
import { useNow } from "./useNow";

export interface RelativeTimeProps {
  date: Date;
  /**
   * The absolute time, such as "8:42 PM": shown on hover beside a relative
   * time, and in its place where `format` gives none.
   */
  absolute: string;
  /**
   * The relative text for `date` at `now`, or undefined to show `absolute`.
   * "Just now", "5 minutes ago", "2 hours ago" and so on by default.
   */
  format?: (date: Date, now: Date) => string | undefined;
  /** The default format's text for the last minute. */
  justNowLabel?: string;
  className?: string;
}

/**
 * A time shown relative to now ("5 minutes ago") that keeps itself up to
 * date. Every RelativeTime on the page reads one shared clock (`useNow`), so
 * a tick re-renders the labels alone, never the list they sit in. Hover shows
 * the absolute time.
 */
export function RelativeTime(props: RelativeTimeProps) {
  const {
    date,
    absolute,
    justNowLabel = "Just now",
    format = (value: Date, now: Date) =>
      formatRelativeTime(value, now, justNowLabel),
    className,
  } = props;
  const now = useNow();
  const relative = format(date, new Date(now));
  const dateTime = date.toISOString();

  if (relative === undefined) {
    return (
      <time dateTime={dateTime} className={className}>
        {absolute}
      </time>
    );
  }
  return (
    <Tooltip title={absolute}>
      <time dateTime={dateTime} className={className}>
        {relative}
      </time>
    </Tooltip>
  );
}
