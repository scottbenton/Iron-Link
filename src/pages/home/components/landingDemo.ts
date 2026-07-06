import { createId } from "lib/id.lib";

import { RollResult, RollType } from "repositories/shared.types";

import { IStatRoll, LogType } from "services/gameLog.service";

export interface DemoLogEntry {
  id: string;
  authorName: string;
  isYou: boolean;
  timeText: string;
  content:
    | { type: "roll"; roll: IStatRoll }
    | { type: "message"; text: string };
}

export interface DemoStat {
  key: string;
  label: string;
  value: number;
}

export function createDemoStatRoll(config: {
  rollLabel: string;
  statKey: string;
  action: number;
  modifier: number;
  challenge1: number;
  challenge2: number;
}): IStatRoll {
  const { rollLabel, statKey, action, modifier, challenge1, challenge2 } =
    config;

  const actionTotal = Math.min(10, action + modifier);

  let result: RollResult = RollResult.WeakHit;
  if (actionTotal > challenge1 && actionTotal > challenge2) {
    result = RollResult.StrongHit;
  } else if (actionTotal <= challenge1 && actionTotal <= challenge2) {
    result = RollResult.Miss;
  }

  return {
    id: createId(),
    logType: LogType.ROLL,
    gameId: "landing-demo",
    type: RollType.Stat,
    rollLabel,
    timestamp: new Date(),
    characterId: null,
    uid: "",
    guidesOnly: false,
    statKey,
    action,
    actionTotal,
    challenge1,
    challenge2,
    result,
    modifier,
    adds: 0,
    momentumBurned: null,
    matchedNegativeMomentum: false,
  };
}
