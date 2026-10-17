// @vitest-environment node
import type { Datasworn } from "@datasworn-community/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorldFieldType } from "types/worldField.type";

import { createWorldFieldConfiguration } from "lib/worldFieldRules";
import {
  createWorldOracleLookup,
  getWorldFieldRollTarget,
  rollWorldFieldValue,
  rollWorldOracleText,
} from "lib/worldOracleRoll";

import { catalogOf, oracle } from "./worldOracleFixtures";

const binding = (oracleId: string) => ({
  packageId: "starforged",
  oracleId: `oracle_rollable:${oracleId}`,
  resolvedOracleId: `oracle_rollable:${oracleId}`,
});

const textField = (oracleId: string | null) => ({
  type: WorldFieldType.Text,
  configuration: createWorldFieldConfiguration(),
  binding: oracleId ? binding(oracleId) : null,
});

const optionList = (
  oracleId: string,
  settings: { allowOther?: boolean; multiple?: boolean } = {},
) => ({
  type: WorldFieldType.Select,
  configuration: {
    ...createWorldFieldConfiguration(),
    suggestions: ["Dominion", "Guild"],
    multiple: !!settings.multiple,
    allowOther: !!settings.allowOther,
  },
  binding: binding(oracleId),
});

// Each roll of a two-row oracle lands on the given row, counting from 1.
function rollRows(...rows: number[]) {
  const spy = vi.spyOn(Math, "random");
  for (const row of rows) spy.mockReturnValueOnce((row - 0.5) / 2);
}

afterEach(() => vi.restoreAllMocks());

describe("rollWorldOracleText", () => {
  it("returns a row's text as one plain line", () => {
    const goals = oracle("starforged/character/goal", [
      "**Find** a [lost](datasworn:x) home\nfor good",
    ]);
    expect(
      rollWorldOracleText(goals._id, createWorldOracleLookup(catalogOf(goals))),
    ).toBe("Find a lost home for good");
  });

  it("rolls the oracles a row rolls automatically", () => {
    const sub = oracle("sub", ["Ash"]);
    const main = oracle("main", [
      {
        text: "Roll twice",
        oracle_rolls: [
          { oracle: sub._id, auto: true, number_of_rolls: 2 },
        ] as Datasworn.OracleRollableRow["oracle_rolls"],
      },
    ]);
    expect(
      rollWorldOracleText(
        main._id,
        createWorldOracleLookup(catalogOf(main, sub)),
      ),
    ).toBe("Ash, Ash");
  });

  it("rolls linked oracles in place only when asked", () => {
    const legacy = oracle("legacy", ["Silver"]);
    const template = oracle("template", [
      "[Legacy](datasworn:oracle_rollable:legacy) *of the* Sun",
    ]);
    const lookup = createWorldOracleLookup(catalogOf(template, legacy));
    expect(rollWorldOracleText(template._id, lookup)).toBe("Legacy of the Sun");
    expect(
      rollWorldOracleText(template._id, lookup, { expandLinks: true }),
    ).toBe("Silver of the Sun");
  });

  it("reports the outer roll once, with the result it gave", () => {
    const sub = { ...oracle("sub", ["Ash"]), name: "Sub" };
    const main = {
      ...oracle("main", [
        {
          text: "Roll",
          oracle_rolls: [
            { oracle: sub._id, auto: true, number_of_rolls: 1 },
          ] as Datasworn.OracleRollableRow["oracle_rolls"],
        },
      ]),
      name: "Main",
    } as Datasworn.OracleRollable;
    const onRoll = vi.fn();
    rollWorldOracleText(
      main._id,
      createWorldOracleLookup(catalogOf(main, sub)),
      {
        onRoll,
      },
    );
    expect(onRoll).toHaveBeenCalledTimes(1);
    expect(onRoll).toHaveBeenCalledWith({
      oracleId: main._id,
      oracleName: "Main",
      roll: 1,
      text: "Ash",
    });
  });

  it("rolls nothing for an oracle outside the catalog", () => {
    expect(
      rollWorldOracleText("oracle_rollable:missing", () => undefined),
    ).toBeUndefined();
  });
});

describe("getWorldFieldRollTarget", () => {
  const goals = oracle("goal", ["Escape"]);
  const catalog = catalogOf(goals);

  it("rolls a bound Text field or option list", () => {
    expect(getWorldFieldRollTarget(textField("goal"), catalog)).toBe(goals._id);
    expect(getWorldFieldRollTarget(optionList("goal"), catalog)).toBe(
      goals._id,
    );
  });

  it("offers no roll without a binding, a catalog or the oracle", () => {
    expect(getWorldFieldRollTarget(textField(null), catalog)).toBeUndefined();
    expect(getWorldFieldRollTarget(textField("goal"), null)).toBeUndefined();
    expect(
      getWorldFieldRollTarget(textField("missing"), catalog),
    ).toBeUndefined();
  });

  it("never rolls a linked entry", () => {
    const linked = {
      ...optionList("goal"),
      configuration: {
        ...optionList("goal").configuration,
        targetCategoryId: "people",
        suggestions: [],
      },
    };
    expect(getWorldFieldRollTarget(linked, catalog)).toBeUndefined();
  });
});

describe("rollWorldFieldValue", () => {
  const types = oracle("faction/type", ["guild", "Cult"]);
  const catalog = catalogOf(types);
  const lookup = createWorldOracleLookup(catalog);

  it("picks the option a result names, whatever its case", () => {
    rollRows(1);
    expect(
      rollWorldFieldValue(optionList("faction/type"), null, catalog, lookup),
    ).toBe("Guild");
  });

  it("rerolls a strict list until a result is one of its options", () => {
    rollRows(2, 2, 1);
    expect(
      rollWorldFieldValue(optionList("faction/type"), null, catalog, lookup),
    ).toBe("Guild");
  });

  it("reports only the roll a strict list kept, as the option it chose", () => {
    rollRows(2, 1);
    const onRoll = vi.fn();
    rollWorldFieldValue(
      optionList("faction/type"),
      null,
      catalog,
      lookup,
      onRoll,
    );
    expect(onRoll).toHaveBeenCalledTimes(1);
    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ roll: 1, text: "Guild" }),
    );
  });

  it("keeps any result in an open list", () => {
    rollRows(2);
    expect(
      rollWorldFieldValue(
        optionList("faction/type", { allowOther: true }),
        null,
        catalog,
        lookup,
      ),
    ).toBe("Cult");
  });

  it("adds the rolled option to a list that holds several", () => {
    rollRows(1);
    expect(
      rollWorldFieldValue(
        optionList("faction/type", { multiple: true }),
        ["Dominion"],
        catalog,
        lookup,
      ),
    ).toEqual(["Dominion", "Guild"]);
  });

  it("gives up on a strict list the oracle never matches", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    expect(
      rollWorldFieldValue(optionList("faction/type"), null, catalog, lookup),
    ).toBeUndefined();
  });
});
