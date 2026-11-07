import { Datasworn } from "@datasworn-community/core";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_STAT_VALUE,
  getReferenceRollOptions,
} from "../data/referenceRollOptions";

const statRules = {
  edge: { label: "edge" },
  wits: { label: "wits" },
} as unknown as Record<string, Datasworn.StatRule>;
const meterRules = {
  health: { label: "health", value: 5 },
} as unknown as Record<string, Datasworn.ConditionMeterRule>;
const trackRules = {
  bonds_legacy: { label: "bonds" },
} as unknown as Record<string, Datasworn.SpecialTrackRule>;

function move(partial: object): Datasworn.AnyMove {
  return partial as unknown as Datasworn.AnyMove;
}

describe("getReferenceRollOptions", () => {
  it("lists each stat and meter a trigger names once", () => {
    const options = getReferenceRollOptions(
      move({
        roll_type: "action_roll",
        trigger: {
          conditions: [
            {
              roll_options: [
                { using: "stat", stat: "edge" },
                { using: "stat", stat: "wits" },
              ],
            },
            {
              roll_options: [
                { using: "stat", stat: "edge" },
                { using: "condition_meter", condition_meter: "health" },
              ],
            },
          ],
        },
      }),
      statRules,
      meterRules,
      trackRules,
    );
    expect(options).toEqual({
      kind: "action",
      options: [
        {
          key: "stat:edge",
          statId: "edge",
          label: "edge",
          defaultValue: DEFAULT_STAT_VALUE,
        },
        {
          key: "stat:wits",
          statId: "wits",
          label: "wits",
          defaultValue: DEFAULT_STAT_VALUE,
        },
        {
          key: "condition_meter:health",
          statId: "health",
          label: "health",
          defaultValue: 5,
        },
      ],
    });
  });

  it("fixes a custom option's value", () => {
    const options = getReferenceRollOptions(
      move({
        roll_type: "action_roll",
        trigger: {
          conditions: [
            { roll_options: [{ using: "custom", label: "Rank", value: 3 }] },
          ],
        },
      }),
      statRules,
      meterRules,
      trackRules,
    );
    expect(options).toEqual({
      kind: "action",
      options: [
        {
          key: "custom:Rank:3",
          statId: "Rank",
          label: "Rank",
          defaultValue: 3,
          fixedValue: 3,
        },
      ],
    });
  });

  it("rolls a legacy track's score for a special track move", () => {
    const options = getReferenceRollOptions(
      move({
        roll_type: "special_track",
        trigger: {
          conditions: [{ roll_options: [{ using: "bonds_legacy" }] }],
        },
      }),
      statRules,
      meterRules,
      trackRules,
    );
    expect(options).toEqual({
      kind: "special_track",
      tracks: [{ key: "bonds_legacy", label: "bonds" }],
    });
  });

  it("offers nothing for a move with no roll", () => {
    expect(
      getReferenceRollOptions(
        move({ roll_type: "no_roll", trigger: { conditions: [] } }),
        statRules,
        meterRules,
        trackRules,
      ),
    ).toEqual({ kind: "none" });
  });
});
