import { Datasworn } from "@datasworn-community/core";
import classic from "@datasworn-community/ironsworn-classic/json/classic.json";
import starforged from "@datasworn-community/starforged/json/starforged.json";
import { describe, expect, it, vi } from "vitest";

import { parseSpecialTrackRules } from "stores/dataswornTreeHelpers/specialTrackRules";

import { getWorldBondMechanics } from "../worldBonds.lib";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

const rules = (...packages: unknown[]) =>
  parseSpecialTrackRules(
    Object.fromEntries(
      (packages as Datasworn.RulesPackage[]).map((p) => [p._id, p]),
    ),
  );

describe("getWorldBondMechanics", () => {
  it("uses Ironlands bonds for classic games", () => {
    expect(getWorldBondMechanics(rules(classic))).toEqual({
      kind: "bond",
      trackKey: "bonds",
      trackLabel: "bonds",
    });
  });

  it("uses connections for Starforged games", () => {
    expect(getWorldBondMechanics(rules(starforged))).toEqual({
      kind: "connection",
      trackKey: "bonds_legacy",
      trackLabel: "bonds",
    });
  });

  it("has no bonds without a bonds track", () => {
    expect(getWorldBondMechanics({})).toBeNull();
  });
});
