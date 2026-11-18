import { describe, expect, it } from "vitest";

import {
  actionAndTheme,
  askTheOracleLikely,
  compelBurnedMomentum,
  endureHarmOne,
  faceDangerStrongHit,
  fulfillYourVowProgress,
  gatherInformationCancelled,
  strikeMiss,
} from "../../stories/fixtures/rolls";
import { getRollSummary, getRollTitle } from "./getRollSummary";
import { getRollOutcome } from "./rollTypes";

describe("getRollSummary", () => {
  it("reads an action roll with a match", () => {
    expect(getRollSummary(faceDangerStrongHit)).toBe(
      "Face Danger, Edge: Strong Hit. Action die 4 plus 3, total 7. Challenge dice 5 and 5. Match.",
    );
  });

  it("reads adds", () => {
    expect(getRollSummary(strikeMiss)).toBe(
      "Strike, Iron: Miss. Action die 3 plus 2 plus 1, total 6. Challenge dice 7 and 9.",
    );
  });

  it("reads burned momentum in place of the action score", () => {
    expect(getRollSummary(compelBurnedMomentum)).toBe(
      "Compel, Heart: Strong Hit. Burned 9 momentum in place of the action score. Challenge dice 5 and 8.",
    );
  });

  it("reads a cancelled action die", () => {
    expect(getRollSummary(gatherInformationCancelled)).toBe(
      "Gather Information, Wits: Miss. Action die 2, cancelled by negative momentum plus 1, total 1. Challenge dice 3 and 6.",
    );
  });

  it("flags a one on the action die", () => {
    expect(getRollSummary(endureHarmOne)).toMatch(/One on the action die\.$/);
  });

  it("reads a progress roll", () => {
    expect(getRollSummary(fulfillYourVowProgress)).toBe(
      "Fulfill Your Vow, Recover the Hollow Crown: Weak Hit. Progress 8 against challenge dice 3 and 9.",
    );
  });

  it("reads oracle rolls", () => {
    expect(getRollSummary(askTheOracleLikely)).toBe(
      "Likely (Ask the Oracle): Yes. Roll 44. Match.",
    );
    expect(getRollSummary(actionAndTheme)).toBe(
      "Action + Theme (Core Oracles): Evade; Survival. Roll 42, 87.",
    );
  });

  it("starts with a prefix and takes translated words", () => {
    expect(
      getRollSummary(strikeMiss, {
        prefix: "Kira Vale, 8:42 PM",
        text: { outcomes: { miss: "Fallo" } },
      }),
    ).toMatch(/^Kira Vale, 8:42 PM\. Strike, Iron: Fallo\./);
  });

  it("titles a roll by its move, else what was rolled", () => {
    expect(getRollTitle(faceDangerStrongHit)).toBe("Face Danger");
    expect(getRollTitle({ ...faceDangerStrongHit, moveName: undefined })).toBe(
      "Edge",
    );
    expect(getRollTitle(actionAndTheme)).toBe("Action + Theme");
  });
});

describe("getRollOutcome", () => {
  it("needs to beat, not tie, each die", () => {
    expect(getRollOutcome(7, [5, 5])).toBe("strongHit");
    expect(getRollOutcome(5, [5, 3])).toBe("weakHit");
    expect(getRollOutcome(5, [5, 5])).toBe("miss");
  });
});
