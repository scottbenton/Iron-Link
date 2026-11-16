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

type MoveCollection = {
  contents?: Record<string, Datasworn.AnyMove>;
  collections?: Record<string, MoveCollection>;
};
function collectMoves(collections: Record<string, MoveCollection> = {}) {
  const moves: Record<string, Datasworn.AnyMove> = {};
  Object.values(collections).forEach((collection) => {
    Object.values(collection.contents ?? {}).forEach((move) => {
      moves[move._id] = move;
    });
    Object.assign(moves, collectMoves(collection.collections));
  });
  return moves;
}
const moves = (...packages: unknown[]) =>
  Object.assign(
    {},
    ...(packages as { moves?: Record<string, MoveCollection> }[]).map((p) =>
      collectMoves(p.moves),
    ),
  ) as Record<string, Datasworn.AnyMove>;

describe("getWorldBondMechanics", () => {
  it("uses Ironlands bonds for classic games", () => {
    expect(getWorldBondMechanics(rules(classic), moves(classic))).toEqual({
      kind: "bond",
      trackKey: "bonds",
      trackLabel: "bonds",
      connectionMoves: [],
    });
  });

  it("uses connections for Starforged games", () => {
    expect(getWorldBondMechanics(rules(starforged), moves(starforged))).toEqual(
      {
        kind: "connection",
        trackKey: "bonds_legacy",
        trackLabel: "bonds",
        connectionMoves: [
          {
            id: "move:starforged/connection/forge_a_bond",
            name: "Forge a Bond",
          },
        ],
      },
    );
  });

  it("uses connections when homebrew adds a connection move to classic", () => {
    const homebrewMove = {
      ...moves(starforged)["move:starforged/connection/forge_a_bond"],
      _id: "move:homebrew/connection/forge_a_bond",
    } as Datasworn.AnyMove;
    expect(
      getWorldBondMechanics(rules(classic), {
        ...moves(classic),
        [homebrewMove._id]: homebrewMove,
      }),
    ).toEqual({
      kind: "connection",
      trackKey: "bonds",
      trackLabel: "bonds",
      connectionMoves: [{ id: homebrewMove._id, name: "Forge a Bond" }],
    });
  });

  it("has no bonds without a bonds track", () => {
    expect(getWorldBondMechanics({}, {})).toBeNull();
  });
});
