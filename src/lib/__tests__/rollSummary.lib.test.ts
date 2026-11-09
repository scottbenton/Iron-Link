import { describe, expect, it } from "vitest";

import { i18n } from "i18n/config";

import { RollResult, RollType } from "repositories/shared.types";
import { TrackTypes } from "repositories/tracks.repository";

import {
  IOracleTableRoll,
  IStatRoll,
  ITrackProgressRoll,
  LogType,
} from "services/gameLog.service";

import {
  getPlainRollText,
  getRollSummary,
  getRollTitle,
  isOracleRollMatch,
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

function statRoll(overrides: Partial<IStatRoll> = {}): IStatRoll {
  return {
    ...base,
    type: RollType.Stat,
    rollLabel: "Edge",
    statKey: "edge",
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

function oracleRoll(
  overrides: Partial<IOracleTableRoll> = {},
): IOracleTableRoll {
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

describe("getRollSummary", () => {
  it("reads a stat roll's move, result and dice", () => {
    expect(getRollSummary(statRoll(), { moveName: "Face Danger" }, t)).toBe(
      "Face Danger, Edge: Weak Hit. Action die 3 plus 2, total 5. Challenge dice 4 and 7.",
    );
  });

  it("reads matches, a one on the action die and cancelled momentum", () => {
    expect(
      getRollSummary(
        statRoll({
          action: 1,
          modifier: 0,
          actionTotal: 0,
          challenge1: 6,
          challenge2: 6,
          matchedNegativeMomentum: true,
          result: RollResult.Miss,
        }),
        {},
        t,
      ),
    ).toBe(
      "Edge: Miss. Action die 1, cancelled by negative momentum. Challenge dice 6 and 6. Match. One on the action die.",
    );
  });

  it("reads burned momentum in place of the action die", () => {
    expect(
      getRollSummary(
        statRoll({ momentumBurned: 8, result: RollResult.StrongHit }),
        {},
        t,
      ),
    ).toBe(
      "Edge: Strong Hit. Burned 8 momentum in place of the action die. Challenge dice 4 and 7.",
    );
  });

  it("reads a progress roll", () => {
    const roll: ITrackProgressRoll = {
      ...base,
      type: RollType.TrackProgress,
      rollLabel: "Find the sword",
      trackType: TrackTypes.Vow,
      moveId: "move",
      trackProgress: 6,
      challenge1: 3,
      challenge2: 3,
      result: RollResult.StrongHit,
    };
    expect(getRollSummary(roll, { moveName: "Fulfill Your Vow" }, t)).toBe(
      "Fulfill Your Vow, Find the sword: Strong Hit. Progress 6 against challenge dice 3 and 3. Match.",
    );
  });

  it("reads an oracle roll's result as plain text", () => {
    expect(
      getRollSummary(
        oracleRoll({
          oracleCategoryName: "Core",
          result: "[Bolster](datasworn:link).",
          cursedDieRoll: 10,
          cursedDieAdditiveResult: "A curse",
        }),
        { showOracleMatch: true },
        t,
      ),
    ).toBe(
      "Action (Core): Bolster. The cursed die adds: A curse. Roll 34. Cursed die 10. Match.",
    );
  });
});

describe("getRollTitle", () => {
  it("prefers the move or oracle name over the stored label", () => {
    expect(getRollTitle(statRoll(), { moveName: "Face Danger" })).toBe(
      "Face Danger",
    );
    expect(getRollTitle(statRoll(), {})).toBe("Edge");
    expect(getRollTitle(oracleRoll(), { oracleName: "Action Oracle" })).toBe(
      "Action Oracle",
    );
  });
});

describe("getPlainRollText", () => {
  it("joins list lines and keeps link text", () => {
    expect(getPlainRollText("* Name: [Kai](link)\n* Role: Pilot")).toBe(
      "Name: Kai; Role: Pilot",
    );
  });
});

describe("isOracleRollMatch", () => {
  it("matches when the last two digits agree", () => {
    expect(isOracleRollMatch(44)).toBe(true);
    expect(isOracleRollMatch(100)).toBe(true);
    expect(isOracleRollMatch(45)).toBe(false);
    expect(isOracleRollMatch([11, 22])).toBe(false);
  });
});
