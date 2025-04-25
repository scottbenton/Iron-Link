import dayjs from "dayjs";

export interface LogEntryTimestampSplitterProps {
  currentTimestamp: Date;
  priorTimestamp?: Date;
}

export function LogEntryTimestampSplitter(
  props: LogEntryTimestampSplitterProps,
) {
  const { currentTimestamp, priorTimestamp } = props;

  return <></>;
  // const diff = dayjs(currentTimestamp).diff(dayjs(priorTimestamp), "hour");
  // if (diff > 6) {
  // }

  // const relativeLogTimeString = getRelativeTimeString(timestamp);

  // return <>{relativeLogTimeString}</>;
}
