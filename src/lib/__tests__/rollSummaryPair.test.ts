/**
 * Roll summaries, app and library side by side (migration slice 4).
 *
 * Each case is one game log roll and the library roll data that says the
 * same thing. The app's summary is what players hear today; the library's
 * is what the new roll card will read. Where the two differ, changes.md
 * says which wording wins.
 */
import { describe, expect, it } from "vitest";

import {
  getRollSummary as getLibraryRollSummary,
  getRollTitle as getLibraryRollTitle,
} from "ui/game/RollCard/getRollSummary";
import { RollData } from "ui/game/RollCard/rollTypes";

import { i18n } from "i18n/config";

import { RollResult, RollType } from "repositories/shared.types";
import { TrackTypes } from "repositories/tracks.repository";

import {
  IGameLogRoll,
  IOracleTableRoll,
  IStatRoll,
  LogType,
} from "services/gameLog.service";

import {
  RollSummaryNames,
  getRollSummary,
  getRollTitle,
  toRollData,
} from "../rollSummary.lib";

const t = i18n.t.bind(i18n);

const base = {
  id: "roll-1",
  logType: LogType.ROLL as const,
  timestamp: new Date(0),
  gameId: "game",
  characterId: null,
  uid: "uid",
  guidesOnly: false,
};

function statRoll(overrides: Partial<IStatRoll>): IStatRoll {
  return {
    ...base,
    type: RollType.Stat,
    rollLabel: "Edge",
    statKey: "edge",
    moveId: "move",
    action: 3,
    actionTotal: 5,
    challenge1: 4,
    challenge2: 7,
    modifier: 2,
    adds: 0,
    matchedNegativeMomentum: false,
    momentumBurned: null,
    result: RollResult.WeakHit,
    ...overrides,
  };
}

function oracleRoll(overrides: Partial<IOracleTableRoll>): IOracleTableRoll {
  return {
    ...base,
    type: RollType.OracleTable,
    rollLabel: "Action",
    oracleId: "oracle",
    roll: 34,
    result: "Bolster",
    match: false,
    cursedDieRoll: null,
    cursedDieAdditiveResult: null,
    wasCursed: null,
    ...overrides,
  };
}

interface RollPairCase {
  name: string;
  roll: IGameLogRoll;
  names: RollSummaryNames;
  data: RollData;
}

const rollPairCases: RollPairCase[] = [
  {
    name: "stat roll with a move",
    roll: statRoll({}),
    names: { moveName: "Face Danger" },
    data: {
      kind: "action",
      moveName: "Face Danger",
      statName: "Edge",
      statValue: 2,
      adds: 0,
      actionDie: 3,
      actionScore: 5,
      challengeDice: [4, 7],
      outcome: "weakHit",
      momentumBurned: null,
      negativeMomentumCancelled: false,
    },
  },
  {
    name: "stat roll with adds and no move",
    roll: statRoll({
      rollLabel: "Iron",
      action: 3,
      modifier: 2,
      adds: 1,
      actionTotal: 6,
      challenge1: 7,
      challenge2: 9,
      result: RollResult.Miss,
    }),
    names: {},
    data: {
      kind: "action",
      statName: "Iron",
      statValue: 2,
      adds: 1,
      actionDie: 3,
      actionScore: 6,
      challengeDice: [7, 9],
      outcome: "miss",
      momentumBurned: null,
      negativeMomentumCancelled: false,
    },
  },
  {
    name: "stat roll over the cap of 10",
    roll: statRoll({
      action: 6,
      modifier: 4,
      adds: 2,
      actionTotal: 10,
      challenge1: 2,
      challenge2: 9,
      result: RollResult.StrongHit,
    }),
    names: {},
    data: {
      kind: "action",
      statName: "Edge",
      statValue: 4,
      adds: 2,
      actionDie: 6,
      actionScore: 10,
      challengeDice: [2, 9],
      outcome: "strongHit",
      momentumBurned: null,
      negativeMomentumCancelled: false,
    },
  },
  {
    name: "stat roll cancelled by negative momentum",
    roll: statRoll({
      rollLabel: "Wits",
      action: 2,
      modifier: 1,
      actionTotal: 1,
      challenge1: 3,
      challenge2: 6,
      matchedNegativeMomentum: true,
      result: RollResult.Miss,
    }),
    names: { moveName: "Gather Information" },
    data: {
      kind: "action",
      moveName: "Gather Information",
      statName: "Wits",
      statValue: 1,
      adds: 0,
      actionDie: 2,
      actionScore: 1,
      challengeDice: [3, 6],
      outcome: "miss",
      momentumBurned: null,
      negativeMomentumCancelled: true,
    },
  },
  {
    name: "stat roll with burned momentum and a one on the action die",
    roll: statRoll({
      rollLabel: "Heart",
      action: 1,
      modifier: 2,
      actionTotal: 3,
      challenge1: 5,
      challenge2: 8,
      momentumBurned: 9,
      result: RollResult.StrongHit,
    }),
    names: { moveName: "Compel" },
    data: {
      kind: "action",
      moveName: "Compel",
      statName: "Heart",
      statValue: 2,
      adds: 0,
      actionDie: 1,
      actionScore: 3,
      challengeDice: [5, 8],
      outcome: "strongHit",
      momentumBurned: 9,
      negativeMomentumCancelled: false,
    },
  },
  {
    name: "stat roll with a match and a one, no stat",
    roll: statRoll({
      action: 1,
      modifier: 0,
      actionTotal: 1,
      challenge1: 6,
      challenge2: 6,
      result: RollResult.Miss,
    }),
    names: {},
    data: {
      kind: "action",
      statName: "Edge",
      statValue: 0,
      adds: 0,
      actionDie: 1,
      actionScore: 1,
      challengeDice: [6, 6],
      outcome: "miss",
      momentumBurned: null,
      negativeMomentumCancelled: false,
    },
  },
  {
    name: "progress roll",
    roll: {
      ...base,
      type: RollType.TrackProgress,
      rollLabel: "Recover the Hollow Crown",
      trackType: TrackTypes.Vow,
      moveId: "move",
      trackProgress: 8,
      challenge1: 3,
      challenge2: 9,
      result: RollResult.WeakHit,
    },
    names: { moveName: "Fulfill Your Vow" },
    data: {
      kind: "progress",
      moveName: "Fulfill Your Vow",
      trackName: "Recover the Hollow Crown",
      progressScore: 8,
      challengeDice: [3, 9],
      outcome: "weakHit",
    },
  },
  {
    name: "special track roll with a match and no move",
    roll: {
      ...base,
      type: RollType.SpecialTrackProgress,
      rollLabel: "Bonds",
      specialTrackKey: "bonds",
      moveId: "move",
      trackProgress: 4,
      challenge1: 2,
      challenge2: 2,
      result: RollResult.StrongHit,
    },
    names: {},
    data: {
      kind: "progress",
      trackName: "Bonds",
      progressScore: 4,
      challengeDice: [2, 2],
      outcome: "strongHit",
    },
  },
  {
    name: "oracle roll with a category, match and cursed die",
    roll: oracleRoll({
      oracleCategoryName: "Core",
      result: "[Bolster](datasworn:link).",
      cursedDieRoll: 10,
      cursedDieAdditiveResult: "* A [curse](link)",
      roll: 44,
    }),
    names: { oracleName: "Action Oracle", showOracleMatch: true },
    data: {
      kind: "oracle",
      oracleName: "Action Oracle",
      category: "Core",
      roll: 44,
      result: "Bolster.",
      match: true,
      cursedDie: 10,
      cursedResult: "A curse",
    },
  },
  {
    name: "shared oracle roll with list lines and no category",
    roll: oracleRoll({
      rollLabel: "Action + Theme",
      roll: [42, 87],
      result: "* Evade\n* Survival",
    }),
    names: {},
    data: {
      kind: "oracle",
      oracleName: "Action + Theme",
      roll: [42, 87],
      result: "Evade; Survival",
      match: false,
      cursedDie: null,
      cursedResult: null,
    },
  },
  {
    name: "oracle roll from the cursed table",
    roll: oracleRoll({
      rollLabel: "Island Name",
      oracleCategoryName: "Islands",
      roll: 9,
      result: "Blight",
      cursedDieRoll: 10,
      wasCursed: true,
    }),
    names: {},
    data: {
      kind: "oracle",
      oracleName: "Island Name",
      category: "Islands",
      roll: 9,
      result: "Blight",
      match: false,
      cursedDie: 10,
      cursedResult: null,
    },
  },
  {
    name: "clock roll",
    roll: {
      ...base,
      type: RollType.ClockProgression,
      rollLabel: "The Iron Syndicate seizes the mines",
      oracleTitle: "Likely",
      oracleId: "oracle",
      roll: 33,
      result: "Yes",
      match: true,
    },
    names: {},
    data: {
      kind: "clock",
      clockName: "The Iron Syndicate seizes the mines",
      oddsName: "Likely",
      roll: 33,
      result: "Yes",
      match: true,
    },
  },
];

// What each case reads: the app's summary and the library's. Since slice 4
// the app reads through the library, so the two columns agree.
const rollPairSummaries: Record<string, { app: string; library: string }> = {
  "stat roll with a move": {
    app: "Face Danger, Edge: Weak Hit. Action die 3 plus 2, total 5. Challenge dice 4 and 7.",
    library:
      "Face Danger, Edge: Weak Hit. Action die 3 plus 2, total 5. Challenge dice 4 and 7.",
  },
  "stat roll with adds and no move": {
    app: "Iron: Miss. Action die 3 plus 2 plus 1, total 6. Challenge dice 7 and 9.",
    library:
      "Iron: Miss. Action die 3 plus 2 plus 1, total 6. Challenge dice 7 and 9.",
  },
  "stat roll over the cap of 10": {
    app: "Edge: Strong Hit. Action die 6 plus 4 plus 2, total 10. Challenge dice 2 and 9.",
    library:
      "Edge: Strong Hit. Action die 6 plus 4 plus 2, total 10. Challenge dice 2 and 9.",
  },
  "stat roll cancelled by negative momentum": {
    app: "Gather Information, Wits: Miss. Action die 2, cancelled by negative momentum plus 1, total 1. Challenge dice 3 and 6.",
    library:
      // changes.md row 28: no comma after "cancelled by negative momentum".
      "Gather Information, Wits: Miss. Action die 2, cancelled by negative momentum plus 1, total 1. Challenge dice 3 and 6.",
  },
  "stat roll with burned momentum and a one on the action die": {
    app: "Compel, Heart: Strong Hit. Burned 9 momentum in place of the action die. Challenge dice 5 and 8. One on the action die.",
    library:
      // changes.md rows 27 and 29: "action die", and the one still read.
      "Compel, Heart: Strong Hit. Burned 9 momentum in place of the action die. Challenge dice 5 and 8. One on the action die.",
  },
  "stat roll with a match and a one, no stat": {
    app: "Edge: Miss. Action die 1. Challenge dice 6 and 6. Match. One on the action die.",
    library:
      "Edge: Miss. Action die 1. Challenge dice 6 and 6. Match. One on the action die.",
  },
  "progress roll": {
    app: "Fulfill Your Vow, Recover the Hollow Crown: Weak Hit. Progress 8 against challenge dice 3 and 9.",
    library:
      "Fulfill Your Vow, Recover the Hollow Crown: Weak Hit. Progress 8 against challenge dice 3 and 9.",
  },
  "special track roll with a match and no move": {
    app: "Bonds: Strong Hit. Progress 4 against challenge dice 2 and 2. Match.",
    library:
      "Bonds: Strong Hit. Progress 4 against challenge dice 2 and 2. Match.",
  },
  "oracle roll with a category, match and cursed die": {
    app: "Action Oracle (Core): Bolster. The cursed die adds: A curse. Roll 44. Cursed die 10. Match.",
    library:
      "Action Oracle (Core): Bolster. The cursed die adds: A curse. Roll 44. Cursed die 10. Match.",
  },
  "shared oracle roll with list lines and no category": {
    app: "Action + Theme: Evade; Survival. Roll 42, 87.",
    library: "Action + Theme: Evade; Survival. Roll 42, 87.",
  },
  "oracle roll from the cursed table": {
    app: "Island Name (Islands): Blight. Roll 9. Cursed die 10.",
    library: "Island Name (Islands): Blight. Roll 9. Cursed die 10.",
  },
  "clock roll": {
    app: "The Iron Syndicate seizes the mines: Yes. Roll 33. Match.",
    // changes.md row 30: no "Clock, … (Likely)" heading.
    library: "The Iron Syndicate seizes the mines: Yes. Roll 33. Match.",
  },
};

describe("roll summaries, app and library", () => {
  it.each(rollPairCases)("$name", ({ name, roll, names, data }) => {
    expect({
      app: getRollSummary(roll, names, t),
      library: getLibraryRollSummary(data, t),
    }).toEqual(rollPairSummaries[name]);
  });

  it.each(rollPairCases)("maps a $name onto the library's data", (c) => {
    expect(toRollData(c.roll, c.names)).toEqual(c.data);
  });

  it.each(rollPairCases)("titles a $name alike", ({ roll, names, data }) => {
    expect(getRollTitle(roll, names)).toBe(getLibraryRollTitle(data));
  });
});
