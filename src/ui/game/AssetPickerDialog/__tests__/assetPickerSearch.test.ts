// @vitest-environment node
import type { Datasworn } from "@datasworn-community/core";
import { describe, expect, it } from "vitest";

import { filterGroups, searchLine, splitOnMatches } from "../assetPickerSearch";

function asset(name: string, abilities: string[]): Datasworn.Asset {
  return {
    _id: name,
    name,
    abilities: abilities.map((text) => ({ text })),
  } as unknown as Datasworn.Asset;
}

const bot = asset("Protocol Bot", [
  "Your bot is programmed for [diplomacy](move:x).",
  "When you first visit a place, it knows the local customs well enough to translate.",
]);
const banshee = asset("Banshee", ["A winged companion that screams."]);

describe("asset picker search", () => {
  it("keeps only groups and assets that match a name or an ability", () => {
    const groups = [
      { id: "c", name: "Companion", assets: [bot, banshee] },
      { id: "p", name: "Path", assets: [asset("Ace", ["Fly well."])] },
    ];
    expect(filterGroups(groups, "diplomacy")).toEqual([
      { id: "c", name: "Companion", assets: [bot] },
    ]);
    expect(filterGroups(groups, "zzz")).toEqual([]);
  });

  it("shows an ability match from just before it, at a word boundary", () => {
    expect(searchLine(bot, "translate")).toMatch(/^…\S.*translate\.$/);
    expect(searchLine(bot, "protocol")).toBe(
      "Your bot is programmed for diplomacy.",
    );
  });

  it("splits text around every match, keeping its case", () => {
    expect(splitOnMatches("Bot and bot", "bot")).toEqual([
      { text: "Bot", match: true },
      { text: " and ", match: false },
      { text: "bot", match: true },
    ]);
  });
});
