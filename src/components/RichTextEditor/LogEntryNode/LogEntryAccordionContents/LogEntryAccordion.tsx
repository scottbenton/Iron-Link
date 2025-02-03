import { RollType } from "repositories/shared.types";

import { IGameLog } from "services/gameLog.service";

import { OracleRollAccordion } from "./OracleRollAccordion";
import { StatRollAccordion } from "./StatRollAccordion";
import { TrackProgressRollAccordion } from "./TrackProgressRollAccordion";

interface LogEntryAccordionProps {
  log: IGameLog;
}
export function LogEntryAccordion(props: LogEntryAccordionProps) {
  const { log } = props;

  switch (log.type) {
    case RollType.Stat:
      return <StatRollAccordion roll={log} />;
    case RollType.OracleTable:
      return <OracleRollAccordion roll={log} />;
    case RollType.TrackProgress:
    case RollType.SpecialTrackProgress:
      return <TrackProgressRollAccordion roll={log} />;
    default:
      return null;
  }
}
