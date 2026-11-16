import type { Datasworn } from "@datasworn-community/core";
import starforged from "@datasworn-community/starforged/json/starforged.json";
import { describe, expect, it } from "vitest";

import {
  countChosenTruths,
  getWorldTruthsPackageId,
  mapLegacyWorldTruths,
  resolveWorldTruthChoice,
  rollTruth,
} from "../worldTruths.lib";

const truths = (starforged as unknown as Datasworn.Ruleset).truths!;
const cataclysm = truths.cataclysm;

describe("getWorldTruthsPackageId", () => {
  it("reads the setting's own package", () => {
    expect(getWorldTruthsPackageId("world:classic/ironlands")).toBe("classic");
    expect(getWorldTruthsPackageId("world:sundered_isles/sundered_isles")).toBe(
      "sundered_isles",
    );
    expect(getWorldTruthsPackageId("elegy")).toBe("elegy");
    expect(getWorldTruthsPackageId(null)).toBeNull();
  });
});

describe("resolveWorldTruthChoice", () => {
  it("resolves an option and its sub-table row", () => {
    const resolved = resolveWorldTruthChoice(cataclysm, {
      truthId: cataclysm._id,
      optionId: "truth.option:starforged/cataclysm.0",
      subOptionId:
        "truth.option.oracle_rollable.row:starforged/cataclysm.0.sun_plague_cause.0",
      customDescription: null,
    });
    expect(resolved?.kind).toBe("option");
    if (resolved?.kind !== "option") return;
    expect(resolved.optionIndex).toBe(0);
    expect(resolved.subRow?.text).toBe(
      "Temporal distortions from a supermassive black hole",
    );
  });

  it("reads a removed option as not chosen and a removed row as no row", () => {
    expect(
      resolveWorldTruthChoice(cataclysm, {
        truthId: cataclysm._id,
        optionId: "truth.option:starforged/cataclysm.9",
        subOptionId: null,
        customDescription: null,
      }),
    ).toBeUndefined();
    const resolved = resolveWorldTruthChoice(cataclysm, {
      truthId: cataclysm._id,
      optionId: "truth.option:starforged/cataclysm.1",
      subOptionId: "gone",
      customDescription: null,
    });
    expect(resolved?.kind === "option" && resolved.subRow).toBeUndefined();
  });

  it("resolves a written truth", () => {
    expect(
      resolveWorldTruthChoice(cataclysm, {
        truthId: cataclysm._id,
        optionId: null,
        subOptionId: null,
        customDescription: "We did it.",
      }),
    ).toEqual({ kind: "custom", description: "We did it." });
  });

  it("counts only choices that resolve", () => {
    expect(
      countChosenTruths(Object.values(truths), {
        [cataclysm._id]: {
          truthId: cataclysm._id,
          optionId: "truth.option:starforged/cataclysm.2",
          subOptionId: null,
          customDescription: null,
        },
        [truths.exodus._id]: {
          truthId: truths.exodus._id,
          optionId: "truth.option:starforged/exodus.9",
          subOptionId: null,
          customDescription: null,
        },
      }),
    ).toBe(1);
  });
});

describe("mapLegacyWorldTruths", () => {
  it("maps Iron Fellowship and Crew Link selections onto Datasworn ids", () => {
    const mapping = mapLegacyWorldTruths(
      {
        cataclysm: { selectedTruthOptionIndex: 0, selectedSubItemIndex: 2 },
        exodus: { selectedTruthOptionIndex: 1, selectedSubItemIndex: null },
        iron: {
          selectedTruthOptionIndex: -1,
          customTruth: {
            description: "Iron is sacred.",
            questStarter: "Recover the first ingot.",
          },
        },
        laws: {},
      },
      "starforged",
      truths,
    );
    expect(mapping.problems).toEqual([]);
    expect(mapping.choices).toEqual([
      {
        truthId: "truth:starforged/cataclysm",
        optionId: "truth.option:starforged/cataclysm.0",
        subOptionId:
          "truth.option.oracle_rollable.row:starforged/cataclysm.0.sun_plague_cause.2",
        customDescription: null,
      },
      {
        truthId: "truth:starforged/exodus",
        optionId: "truth.option:starforged/exodus.1",
        subOptionId: null,
        customDescription: null,
      },
      {
        truthId: "truth:starforged/iron",
        optionId: null,
        subOptionId: null,
        customDescription: "Iron is sacred.",
      },
    ]);
    expect(mapping.questStarters).toEqual({
      "truth:starforged/iron": "Recover the first ingot.",
    });
  });

  it("never loses written content and reports what it can't map", () => {
    const mapping = mapLegacyWorldTruths(
      {
        homebrew: {
          selectedTruthOptionIndex: -1,
          customTruth: { description: "Our own.", questStarter: "Go." },
        },
        unknown: { selectedTruthOptionIndex: 0 },
        exodus: { selectedTruthOptionIndex: 7 },
        cataclysm: { selectedTruthOptionIndex: 1, selectedSubItemIndex: 99 },
        iron: {
          customTruth: { description: "", questStarter: "Kept anyway." },
        },
      },
      "starforged",
      truths,
    );
    expect(mapping.problems).toEqual([
      { key: "homebrew", problem: "truthMissing" },
      { key: "unknown", problem: "truthMissing" },
      { key: "exodus", problem: "optionMissing" },
      { key: "cataclysm", problem: "subOptionMissing" },
    ]);
    expect(mapping.choices.map((choice) => choice.truthId)).toEqual([
      "truth:starforged/homebrew",
      "truth:starforged/cataclysm",
      "truth:starforged/iron",
    ]);
    expect(mapping.questStarters).toEqual({
      "truth:starforged/homebrew": "Go.",
      "truth:starforged/iron": "Kept anyway.",
    });
  });
});

describe("rollTruth", () => {
  it("picks the option whose range holds the roll, and a sub-table row", () => {
    const rolls = [50, 31];
    const rolled = rollTruth(cataclysm, () => rolls.shift() ?? 1);
    expect(rolled?.roll).toBe(50);
    expect(rolled?.option._id).toBe("truth.option:starforged/cataclysm.1");
    expect(rolled?.subRow?._id).toBe(
      "truth.option.oracle_rollable.row:starforged/cataclysm.1.entities.2",
    );
  });

  it("rolls the whole d100", () => {
    const seen: [number, number][] = [];
    rollTruth(truths.exodus, (min, max) => {
      seen.push([min, max]);
      return max;
    });
    expect(seen[0]).toEqual([1, 100]);
  });
});
