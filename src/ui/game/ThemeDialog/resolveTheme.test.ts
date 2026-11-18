import { describe, expect, it } from "vitest";

import { getAutomaticScheme, resolveTheme } from "./resolveTheme";

const november = new Date(2026, 10, 18);
const june = new Date(2026, 5, 12);

describe("resolveTheme", () => {
  it("uses the character's theme first", () => {
    expect(
      resolveTheme(
        { character: "mystic", game: "eidolon", app: "myriad" },
        november,
      ),
    ).toEqual({ scheme: "mystic", source: "character" });
  });

  it("falls back to the game's theme", () => {
    expect(
      resolveTheme(
        { character: null, game: "eidolon", app: "myriad" },
        november,
      ),
    ).toEqual({ scheme: "eidolon", source: "game" });
  });

  it("falls back to the app theme when the game has none", () => {
    expect(
      resolveTheme({ character: null, game: null, app: "myriad" }, november),
    ).toEqual({ scheme: "myriad", source: "app" });
  });

  it("skips a level that is left out, as in a solo game", () => {
    expect(resolveTheme({ character: null, app: "cinder" }, november)).toEqual({
      scheme: "cinder",
      source: "app",
    });
  });

  it("ends at Automatic: Default most of the year, Pride in June", () => {
    expect(
      resolveTheme({ character: null, game: null, app: null }, november),
    ).toEqual({ scheme: "default", source: "automatic" });
    expect(resolveTheme({}, june)).toEqual({
      scheme: "pride_traditional",
      source: "automatic",
    });
  });

  it("does not let Automatic hide a chosen theme in June", () => {
    expect(resolveTheme({ game: "hinterlands" }, june)).toEqual({
      scheme: "hinterlands",
      source: "game",
    });
  });
});

describe("getAutomaticScheme", () => {
  it("switches on the first and last days of June", () => {
    expect(getAutomaticScheme(new Date(2026, 4, 31))).toBe("default");
    expect(getAutomaticScheme(new Date(2026, 5, 1))).toBe("pride_traditional");
    expect(getAutomaticScheme(new Date(2026, 5, 30))).toBe("pride_traditional");
    expect(getAutomaticScheme(new Date(2026, 6, 1))).toBe("default");
  });
});
