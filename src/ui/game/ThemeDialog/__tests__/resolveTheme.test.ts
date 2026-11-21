import { describe, expect, it } from "vitest";

import {
  charactersHaveThemes,
  getAutomaticScheme,
  resolveTheme,
} from "../resolveTheme";

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

  it("skips a level that is left out, as outside a game", () => {
    expect(resolveTheme({ character: null, app: "cinder" }, november)).toEqual({
      scheme: "cinder",
      source: "app",
    });
  });

  it("takes a one-character solo game's theme from the game", () => {
    // The character level is left out, so a theme the character kept from
    // before can't hide the game's.
    expect(resolveTheme({ game: "eidolon", app: "myriad" }, november)).toEqual({
      scheme: "eidolon",
      source: "game",
    });
  });

  it("ends at Default: Sunrise most of the year, Pride in June", () => {
    expect(
      resolveTheme({ character: null, game: null, app: null }, november),
    ).toEqual({ scheme: "default", source: "automatic" });
    expect(resolveTheme({}, june)).toEqual({
      scheme: "pride_traditional",
      source: "automatic",
    });
  });

  it("does not let Default hide a chosen theme in June", () => {
    expect(resolveTheme({ game: "hinterlands" }, june)).toEqual({
      scheme: "hinterlands",
      source: "game",
    });
  });
});

describe("charactersHaveThemes", () => {
  it("keeps a solo game's one character on the game's theme", () => {
    expect(charactersHaveThemes({ solo: true }, 1)).toBe(false);
    expect(charactersHaveThemes({ solo: true }, 0)).toBe(false);
  });

  it("gives each character its own theme from a second character on", () => {
    expect(charactersHaveThemes({ solo: true }, 2)).toBe(true);
  });

  it("always does in shared games and outside a game", () => {
    expect(charactersHaveThemes({ solo: false }, 1)).toBe(true);
    expect(charactersHaveThemes({}, 1)).toBe(true);
    expect(charactersHaveThemes(undefined, 1)).toBe(true);
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
