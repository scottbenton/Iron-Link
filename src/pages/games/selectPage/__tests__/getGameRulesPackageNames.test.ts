// @vitest-environment node
import { describe, expect, it } from "vitest";

import { getGameRulesPackageNames } from "../getGameRulesPackageNames";

describe("getGameRulesPackageNames", () => {
  it("lists active rulesets, each followed by its active expansions", () => {
    expect(
      getGameRulesPackageNames(
        { starforged: true, classic: true },
        {
          starforged: { sundered_isles: true, starsmith: false },
          classic: { delve: true },
        },
      ),
    ).toEqual(["Starforged", "Sundered Isles", "Ironsworn", "Delve"]);
  });

  it("leaves out packages this build does not know", () => {
    expect(
      getGameRulesPackageNames(
        { starforged: true, retired_ruleset: true },
        { starforged: { retired_expansion: true } },
      ),
    ).toEqual(["Starforged"]);
  });
});
