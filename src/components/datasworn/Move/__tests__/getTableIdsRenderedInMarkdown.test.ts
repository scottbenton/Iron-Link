/** @vitest-environment node */
import { describe, expect, it } from "vitest";

import {
  getTableIdsRenderedInMarkdown,
  withoutRulesPackage,
} from "../getTableIdsRenderedInMarkdown";

describe("withoutRulesPackage", () => {
  it("drops the package so a replacement matches the original's table", () => {
    // Sundered Isles' Withstand Damage embeds the Starforged table.
    expect(
      withoutRulesPackage(
        "move.oracle_rollable:sundered_isles/suffer/withstand_damage.withstand_damage",
      ),
    ).toBe(
      withoutRulesPackage(
        "move.oracle_rollable:starforged/suffer/withstand_damage.withstand_damage",
      ),
    );
  });

  it("does not collapse genuinely different oracles", () => {
    expect(
      withoutRulesPackage(
        "move.oracle_rollable:delve/delve/delve_the_depths.edge",
      ),
    ).not.toBe(
      withoutRulesPackage(
        "move.oracle_rollable:delve/delve/delve_the_depths.wits",
      ),
    );
  });

  it("leaves an id with no package alone", () => {
    expect(withoutRulesPackage("not-an-id")).toBe("not-an-id");
  });
});

describe("getTableIdsRenderedInMarkdown", () => {
  it("finds the {{table>id}} form", () => {
    expect(
      getTableIdsRenderedInMarkdown(
        "Envision it.\n\n{{table>move.oracle_rollable:delve/delve/reveal_a_danger.reveal_a_danger}}",
      ),
    ).toEqual(
      // Normalized: the rules package is dropped.
      new Set(["move.oracle_rollable:delve/reveal_a_danger.reveal_a_danger"]),
    );
  });

  it("finds the {{table:id}} form", () => {
    expect(
      getTableIdsRenderedInMarkdown(
        "{{table:classic/oracles/action_and_theme/action}}",
      ),
    ).toEqual(new Set(["classic/oracles/action_and_theme/action"]));

    expect(
      getTableIdsRenderedInMarkdown(
        "{{table>oracle_rollable:classic/oracles/action_and_theme/action}}",
      ),
    ).toEqual(new Set(["oracle_rollable:oracles/action_and_theme/action"]));
  });

  it("ignores a plain link to the same oracle", () => {
    // A link is not a rendered table, so the table still needs drawing.
    expect(
      getTableIdsRenderedInMarkdown(
        "See [the odds](datasworn:move.oracle_rollable:classic/fate/ask_the_oracle.likely).",
      ).size,
    ).toBe(0);
  });

  it("handles prose and undefined text", () => {
    expect(getTableIdsRenderedInMarkdown("Just prose.").size).toBe(0);
    expect(getTableIdsRenderedInMarkdown(undefined).size).toBe(0);
  });
});
