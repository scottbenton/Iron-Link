// @vitest-environment node
import { describe, expect, it } from "vitest";

import { getGameLogGroupPositions } from "../gameLogGroups";

const at = (minutes: number) => new Date(2026, 10, 18, 20, minutes);
const kira = { name: "Kira Vale" };
const orrin = { name: "Orrin" };

describe("getGameLogGroupPositions", () => {
  it("groups one author's entries a few minutes apart", () => {
    expect(
      getGameLogGroupPositions([
        { author: kira, timestamp: at(0) },
        { author: kira, timestamp: at(2) },
        { author: kira, timestamp: at(6) },
        { author: orrin, timestamp: at(7) },
      ]),
    ).toEqual(["first", "middle", "last", "single"]);
  });

  it("starts a new group after a longer pause, a new day or a change of audience", () => {
    expect(
      getGameLogGroupPositions([
        { author: kira, timestamp: at(0) },
        { author: kira, timestamp: at(6) },
        { author: kira, timestamp: at(7), guideOnly: true },
        { author: kira, timestamp: new Date(2026, 10, 18, 23, 58) },
        { author: kira, timestamp: new Date(2026, 10, 19, 0, 1) },
      ]),
    ).toEqual(["single", "single", "single", "single", "single"]);
  });

  it("keeps apart two players writing for one character, and same-named authors with ids", () => {
    expect(
      getGameLogGroupPositions([
        { author: { ...kira, writtenBy: "rolled by Scott" }, timestamp: at(0) },
        { author: { ...kira, writtenBy: "rolled by Sam" }, timestamp: at(1) },
        { author: { name: "Ash", id: "a" }, timestamp: at(2) },
        { author: { name: "Ash", id: "b" }, timestamp: at(3) },
      ]),
    ).toEqual(["single", "single", "single", "single"]);
  });

  it("turns off with a window of 0", () => {
    expect(
      getGameLogGroupPositions(
        [
          { author: kira, timestamp: at(0) },
          { author: kira, timestamp: at(1) },
        ],
        0,
      ),
    ).toEqual(["single", "single"]);
  });
});
