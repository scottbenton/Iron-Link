import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

import { RULESETS, loadRules } from "tests/datasworn/rulesets";

import { Move } from "../Move";

vi.mock("pages/games/hooks/useRollOracleAndAddToLog", () => ({
  useRollOracleAndAddToLog: () => vi.fn(),
}));

// These moves' text closes its macro with four braces ("...}}}}"), a typo in
// the published data, so the macro shows as written.
const MALFORMED_IN_DATA = new Set([
  "move:fe_runners/exploration/find_an_opportunity",
  "move:fe_runners/exploration/reveal_danger",
]);

function getShownMoves() {
  // The map also holds moves under the ids of those they replace.
  const moves = new Map(
    Object.values(useDataswornTreeStore.getState().moves.moveMap).map(
      (move) => [move._id, move],
    ),
  );
  return [...moves.values()];
}

// GFM tables written into a move's own text (Ask the Oracle's odds).
function countMarkdownTables(text: string) {
  return (text.match(/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/gm) ?? [])
    .length;
}

function renderMove(moveId: string) {
  return render(<Move moveId={moveId} hideRollOptions />);
}

// A move's tables come from MoveOracles, under its text. The table macros in
// the text itself draw nothing, so no table shows twice (changes.md row 22).
describe("Move tables", () => {
  it("shows Delve the Depths' three tables once each", () => {
    loadRules(RULESETS.classic);
    renderMove("move:delve/delve/delve_the_depths");

    expect(screen.getAllByRole("table")).toHaveLength(3);
  });

  it("shows Sundered Isles' Withstand Damage table once, though its text names Starforged's", () => {
    loadRules(RULESETS.starforged);
    const moveId = "move:sundered_isles/suffer/withstand_damage";
    const move = useDataswornTreeStore.getState().moves.moveMap[moveId];
    expect(move?.text).toContain(
      "move.oracle_rollable:starforged/suffer/withstand_damage",
    );

    renderMove(moveId);

    expect(screen.getAllByRole("table")).toHaveLength(1);
  });

  it.each(Object.keys(RULESETS) as Array<keyof typeof RULESETS>)(
    "shows each %s move's own tables, and no macro text",
    (ruleset) => {
      loadRules(RULESETS[ruleset]);
      const moves = getShownMoves().filter(
        (move) => move.text.includes("{{") && !MALFORMED_IN_DATA.has(move._id),
      );
      expect(moves.length).toBeGreaterThan(0);

      for (const move of moves) {
        const { container, unmount } = renderMove(move._id);
        const ownTables = Object.keys(
          "oracles" in move ? (move.oracles ?? {}) : {},
        ).length;
        expect(
          container.querySelectorAll("table"),
          `${move._id} tables`,
        ).toHaveLength(ownTables + countMarkdownTables(move.text));
        expect(container.textContent, `${move._id} text`).not.toContain("{{");
        unmount();
      }
    },
  );
});
