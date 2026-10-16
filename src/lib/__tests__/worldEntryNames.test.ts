// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getWorldEntryNameGenerator,
  rollWorldEntryName,
} from "lib/worldEntryNames";
import { createWorldOracleLookup } from "lib/worldOracleRoll";

import { catalogOf, oracle } from "./worldOracleFixtures";

afterEach(() => vi.restoreAllMocks());

const starforged = createWorldOracleLookup(
  catalogOf(
    oracle("starforged/character/name/given_name", ["Kira"]),
    oracle("starforged/character/name/family_name", ["Vale"]),
    oracle("starforged/settlement/name", ["Aegis"]),
    oracle("starforged/space/sector_name/prefix", ["Ashen"]),
    oracle("starforged/space/sector_name/suffix", ["Reach"]),
    oracle("starforged/planet/ice/name", ["Rime"]),
  ),
);
const values =
  (entries: Record<string, string>) =>
  (key: string): string | undefined =>
    entries[key];

function rollName(
  keys: string[],
  entryValues: Record<string, string>,
  lookup = starforged,
) {
  const generator = getWorldEntryNameGenerator(
    new Set(keys),
    values(entryValues),
    lookup,
  );
  return generator && rollWorldEntryName(generator, lookup);
}

describe("world entry names", () => {
  it("rolls a person's given and family names", () => {
    expect(rollName(["pronouns"], {})).toBe("Kira Vale");
  });

  it("rolls a location's name by its type", () => {
    expect(
      rollName(["locationType"], { locationType: "Planetside Settlement" }),
    ).toBe("Aegis");
    expect(rollName(["locationType"], { locationType: "Sector" })).toBe(
      "Ashen Reach",
    );
    expect(
      rollName(["locationType", "planetClass"], {
        locationType: "Planet",
        planetClass: "Ice World",
      }),
    ).toBe("Rime");
  });

  it("offers no names it cannot roll", () => {
    expect(rollName(["locationType"], {})).toBeUndefined();
    expect(
      rollName(["locationType"], { locationType: "Planet" }),
    ).toBeUndefined();
    expect(
      rollName(["locationType"], { locationType: "Vault" }),
    ).toBeUndefined();
    expect(rollName(["tags"], {})).toBeUndefined();
    expect(rollName(["pronouns"], {}, () => undefined)).toBeUndefined();
  });

  it("prefers the Sundered Isles names where they are loaded", () => {
    const lookup = createWorldOracleLookup(
      catalogOf(
        oracle("sundered_isles/settlement/name", ["Altura"]),
        oracle("starforged/settlement/name", ["Aegis"]),
      ),
    );
    expect(
      rollName(["locationType"], { locationType: "Settlement" }, lookup),
    ).toBe("Altura");
  });
});
