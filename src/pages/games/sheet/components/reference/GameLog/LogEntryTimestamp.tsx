import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";

dayjs.extend(relativeTime);
export interface LogEntryTimestampProps {
  timestamp: Date;
}

export function LogEntryTimestamp(props: LogEntryTimestampProps) {
  const { timestamp } = props;

  const [relativeLogTimeString, setRelativeTimeString] = useState(
    getRelativeTimeString(timestamp),
  );
  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTimeString(getRelativeTimeString(timestamp));
    }, 60000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return <>{relativeLogTimeString}</>;
}

function getRelativeTimeString(timestamp: Date) {
  return dayjs(timestamp).fromNow();
}
