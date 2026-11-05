import { Datasworn } from "@datasworn-community/core";
import { TFunction } from "i18next";

import {
  RollSummaryNames,
  getRollSummary,
  isOracleRollMatch,
} from "lib/rollSummary.lib";

import { RollType } from "repositories/shared.types";

import { IGameLogRoll } from "services/gameLog.service";

import { getMove, useMove } from "./datasworn/useMove";
import {
  getOracleRollable,
  useOracleRollable,
} from "./datasworn/useOracleRollable";

function getMoveId(roll: IGameLogRoll): string {
  if (
    roll.type === RollType.Stat ||
    roll.type === RollType.TrackProgress ||
    roll.type === RollType.SpecialTrackProgress
  ) {
    return roll.moveId ?? "";
  }
  return "";
}

function getOracleId(roll: IGameLogRoll): string | undefined {
  return roll.type === RollType.OracleTable ? roll.oracleId : undefined;
}

function toNames(
  roll: IGameLogRoll,
  move: Datasworn.Move | Datasworn.EmbeddedMove | undefined,
  oracle:
    | Datasworn.OracleRollable
    | Datasworn.EmbeddedOracleRollable
    | undefined,
): RollSummaryNames {
  return {
    moveName: move?.name,
    oracleName: oracle?.name,
    showOracleMatch:
      roll.type === RollType.OracleTable &&
      !!roll.oracleId &&
      !!oracle?.match &&
      isOracleRollMatch(roll.roll),
  };
}

// The move and oracle names a roll card shows, read live.
export function useRollSummaryNames(roll: IGameLogRoll): RollSummaryNames {
  const move = useMove(getMoveId(roll));
  const oracle = useOracleRollable(getOracleId(roll));
  return toNames(roll, move, oracle);
}

export function getRollSummaryNames(roll: IGameLogRoll): RollSummaryNames {
  const moveId = getMoveId(roll);
  const oracleId = getOracleId(roll);
  return toNames(
    roll,
    moveId ? getMove(moveId) : undefined,
    oracleId ? getOracleRollable(oracleId) : undefined,
  );
}

// What a screen reader hears when a roll is made: everything its card shows.
export function getRollAnnouncement(roll: IGameLogRoll, t: TFunction): string {
  return t("datasworn.a11y.rolled", "Rolled {{summary}}", {
    summary: getRollSummary(roll, getRollSummaryNames(roll), t),
  });
}
