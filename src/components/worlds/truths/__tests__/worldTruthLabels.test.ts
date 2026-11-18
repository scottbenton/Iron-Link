// @vitest-environment node
import type { Datasworn } from "@datasworn-community/core";
import starforged from "@datasworn-community/starforged/json/starforged.json";
import { describe, expect, it } from "vitest";

import { withoutTableEmbeds, withoutTableLeadIns } from "../worldTruthLabels";

const truths = (starforged as unknown as Datasworn.Ruleset).truths!;
const summary = (description: string) =>
  withoutTableEmbeds(withoutTableLeadIns(description));

describe("withoutTableLeadIns", () => {
  it("drops a lead-in paragraph before a sub-table", () => {
    const text = summary(truths.cataclysm.options[1].description);
    expect(text).not.toContain("These entities took the form of:");
    expect(text.endsWith("Here, we can hide. Survive.")).toBe(true);
  });

  it("drops only the lead-in sentence and keeps what follows the table", () => {
    const text = summary(truths.artificial_intelligence.options[0].description);
    expect(text).toBe(
      "Our computers are limited to simple digital systems and the most basic machine intelligence.\n\n" +
        "The Adepts serve in place of those advanced systems. They utilize mind-altering drugs to see the universe as a dazzling lattice of data, identifying trends and predicting outcomes with uncanny accuracy. But to gain this insight they sacrifice much of themselves.",
    );
  });

  it("leaves text without a sub-table alone", () => {
    const description =
      truths.cataclysm.options[0].description.split("\n\n")[0];
    expect(withoutTableLeadIns(description)).toBe(description);
  });
});
