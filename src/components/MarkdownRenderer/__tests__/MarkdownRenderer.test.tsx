import { Datasworn } from "@datasworn-community/core";
import elegy from "@datasworn-community/elegy/json/elegy.json";
import feRunners from "@datasworn-community/fe-runners/json/fe_runners.json";
import delve from "@datasworn-community/ironsworn-classic-delve/json/delve.json";
import lodestar from "@datasworn-community/ironsworn-classic-lodestar/json/lodestar.json";
import classic from "@datasworn-community/ironsworn-classic/json/classic.json";
import starforged from "@datasworn-community/starforged/json/starforged.json";
import starsmith from "@datasworn-community/starsmith/json/starsmith.json";
import sunderedIsles from "@datasworn-community/sundered-isles/json/sundered_isles.json";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

import { MarkdownRenderer } from "../MarkdownRenderer";

// Each ruleset with the expansions that ship for it, loaded together as a
// game would load them, so replaced moves and their tables drop out as they
// do in play.
const RULESETS = {
  classic: [classic, delve, lodestar],
  starforged: [starforged, sunderedIsles, starsmith, feRunners],
  elegy: [elegy],
} as unknown as Record<string, Datasworn.RulesPackage[]>;

function loadRules(packages: Datasworn.RulesPackage[]) {
  useDataswornTreeStore
    .getState()
    .setActiveRules(
      Object.fromEntries(packages.map((pkg) => [pkg._id, pkg])),
      {},
    );
}

// These moves' text in the published data closes its directive with four
// braces ("...}}}}"), a typo for the data package to fix.
const MALFORMED_IN_DATA = new Set([
  "move:fe_runners/exploration/find_an_opportunity",
  "move:fe_runners/exploration/reveal_danger",
]);

function getShownMovesWithDirectives(packages: Datasworn.RulesPackage[]) {
  loadRules(packages);
  // The map also holds moves under the ids of those they replace.
  const moves = new Map(
    Object.values(useDataswornTreeStore.getState().moves.moveMap).map(
      (move) => [move._id, move.text],
    ),
  );
  return [...moves].filter(
    ([id, text]) => text.includes("{{") && !MALFORMED_IN_DATA.has(id),
  );
}

describe("MarkdownRenderer", () => {
  it("does not print the table_columns directive in Delve the Depths", () => {
    loadRules(RULESETS.classic);
    const move =
      useDataswornTreeStore.getState().moves.moveMap[
        "move:delve/delve/delve_the_depths"
      ];
    expect(move?.text).toContain("{{table_columns>");

    const { container } = render(<MarkdownRenderer markdown={move.text} />);

    expect(container.textContent).not.toContain("table_columns");
    // The rest of the move's text still renders.
    expect(container.textContent).toContain("traverse an area");
  });

  it("does not print a table directive whose table is not loaded", () => {
    loadRules(RULESETS.elegy);
    const { container } = render(
      <MarkdownRenderer
        markdown={
          "Roll on the table.\n\n{{table>move.oracle_rollable:starforged/suffer/withstand_damage.withstand_damage}}"
        }
      />,
    );
    expect(container.textContent).toContain("Roll on the table.");
    expect(container.textContent).not.toMatch(/\{\{|\}\}/);
  });

  // A move's tables are drawn by MoveOracles after its text, so no directive
  // in a move a game shows should reach the screen as raw text.
  describe.each(Object.entries(RULESETS))("%s", (_ruleset, packages) => {
    it.each(getShownMovesWithDirectives(packages))(
      "leaves no directive on screen for %s",
      (_id, text) => {
        loadRules(packages);
        const { container } = render(<MarkdownRenderer markdown={text} />);
        expect(container.textContent).not.toMatch(/\{\{|\}\}/);
      },
    );
  });
});
