import { TFunction } from "i18next";

import {
  getRollSummary as getLibraryRollSummary,
  getRollTitle as getLibraryRollTitle,
} from "ui/game/RollCard/getRollSummary";
import { RollData, RollOutcome } from "ui/game/RollCard/rollTypes";

import { RollResult, RollType } from "repositories/shared.types";

import { IGameLogRoll } from "services/gameLog.service";

export interface RollSummaryNames {
  // The move a stat or progress roll was made for.
  moveName?: string;
  // The oracle's current name, which can differ from the stored label.
  oracleName?: string;
  // Whether the roll card shows "Match" for this oracle roll.
  showOracleMatch?: boolean;
}

/**
 * Oracle results are markdown. Keeps the text of links and puts list items
 * (a shared-rolls table gives one line per column) on one line.
 */
export function getPlainRollText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .split("\n")
    .map((line) => line.replace(/^\s*[*-]\s+/, "").trim())
    .filter((line) => line.length > 0)
    .join("; ");
}

// Oracle rolls with a match setting match when the last two digits agree.
export function isOracleRollMatch(roll: number | number[]): boolean {
  if (Array.isArray(roll)) {
    return false;
  }
  return roll % 10 === Math.floor(roll / 10) % 10;
}

const rollOutcomes: Record<RollResult, RollOutcome> = {
  [RollResult.StrongHit]: "strongHit",
  [RollResult.WeakHit]: "weakHit",
  [RollResult.Miss]: "miss",
};

/**
 * A game log roll as the library's roll data, which the summary, the title
 * and the new roll cards read. `names` carries what the log does not store
 * (the move's and oracle's current names, whether to show a match).
 */
export function toRollData(
  roll: IGameLogRoll,
  names: RollSummaryNames,
): RollData {
  switch (roll.type) {
    case RollType.Stat:
      return {
        kind: "action",
        ...(names.moveName ? { moveName: names.moveName } : {}),
        statName: roll.rollLabel,
        statValue: roll.modifier,
        adds: roll.adds,
        actionDie: roll.action,
        // The log stores the total already capped at 10.
        actionScore: roll.actionTotal,
        challengeDice: [roll.challenge1, roll.challenge2],
        outcome: rollOutcomes[roll.result],
        momentumBurned: roll.momentumBurned,
        negativeMomentumCancelled: roll.matchedNegativeMomentum,
      };
    case RollType.TrackProgress:
    case RollType.SpecialTrackProgress:
      return {
        kind: "progress",
        ...(names.moveName ? { moveName: names.moveName } : {}),
        trackName: roll.rollLabel,
        progressScore: roll.trackProgress,
        challengeDice: [roll.challenge1, roll.challenge2],
        outcome: rollOutcomes[roll.result],
      };
    case RollType.OracleTable:
      return {
        kind: "oracle",
        oracleName: names.oracleName ?? roll.rollLabel,
        ...(roll.oracleCategoryName
          ? { category: roll.oracleCategoryName }
          : {}),
        roll: roll.roll,
        result: getPlainRollText(roll.result),
        match: !!names.showOracleMatch,
        cursedDie: roll.cursedDieRoll,
        cursedResult: roll.cursedDieAdditiveResult
          ? getPlainRollText(roll.cursedDieAdditiveResult)
          : null,
        // `wasCursed` is not read yet: changes.md row 31 proposes "Cursed."
      };
    case RollType.ClockProgression:
      return {
        kind: "clock",
        clockName: roll.rollLabel,
        oddsName: roll.oracleTitle,
        roll: roll.roll,
        result: getPlainRollText(roll.result),
        match: roll.match,
      };
  }
}

// The name a roll card shows as its title.
export function getRollTitle(
  roll: IGameLogRoll,
  names: RollSummaryNames,
): string {
  return getLibraryRollTitle(toRollData(roll, names));
}

/**
 * One piece of text that says everything a roll card shows: what was rolled,
 * the result, the dice, and a match. Screen readers read it in place of the
 * card, and it is what a roll announces. The library's summary reads it, so
 * the roll cards and announcements share one wording.
 */
export function getRollSummary(
  roll: IGameLogRoll,
  names: RollSummaryNames,
  t: TFunction,
): string {
  return getLibraryRollSummary(toRollData(roll, names), t);
}
