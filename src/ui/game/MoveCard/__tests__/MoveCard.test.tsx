import starforged from "@datasworn-community/starforged/json/starforged.json";
import sunderedIsles from "@datasworn-community/sundered-isles/json/sundered_isles.json";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MoveCard } from "../MoveCard";

// The JSON is typed loosely; the test reads a handful of fields.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;

const starforgedDamage: Loose = (starforged as Loose).moves.suffer.contents
  .withstand_damage;
const sunderedIslesDamage: Loose = (sunderedIsles as Loose).moves.suffer
  .contents.withstand_damage;

// Every embedded oracle of both moves, by id.
const oracles: Record<string, Loose> = Object.fromEntries(
  [starforgedDamage, sunderedIslesDamage].flatMap((move) =>
    Object.values(move.oracles).map((oracle: Loose) => [oracle._id, oracle]),
  ),
);

describe("MoveCard tables", () => {
  // Sundered Isles' Withstand Damage text names Starforged's table, not its
  // own. Given a lookup that finds Starforged's table (a playset that keeps
  // it), the card draws that table in the text and its own under Show
  // oracles. Pinned as it stands; changes.md row 22 proposes hiding every
  // table macro in a move's text.
  it("draws a table its text names that isn't one of its own, beside its own", () => {
    expect(sunderedIslesDamage.text).toContain(
      "{{table>move.oracle_rollable:starforged/suffer/withstand_damage.withstand_damage}}",
    );

    render(
      <MoveCard
        move={sunderedIslesDamage}
        defaultOraclesShown
        resolveOracle={(id) => oracles[id]}
      />,
    );

    expect(screen.getAllByRole("table")).toHaveLength(2);
  });

  it("skips the macro naming its own table", () => {
    render(
      <MoveCard
        move={starforgedDamage}
        defaultOraclesShown
        resolveOracle={(id) => oracles[id]}
      />,
    );

    expect(screen.getAllByRole("table")).toHaveLength(1);
  });
});
