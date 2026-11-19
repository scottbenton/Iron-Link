import type { SchemeName } from "ui/theme";

/** A level's own choice: a scheme, or null to use the next level's. */
export type ThemeChoice = SchemeName | null;

/** Where the theme in effect comes from. */
export type ThemeSource = "character" | "game" | "app" | "automatic";

export interface ResolvedTheme {
  scheme: SchemeName;
  source: ThemeSource;
}

/**
 * The levels to resolve, most specific first. Leave a level out where it does
 * not apply: `game` outside a game, and `character` outside a character or
 * where characters have no theme of their own (`charactersHaveThemes`: a
 * solo game with one character, whose theme is the game's).
 */
export interface ThemeLevels {
  character?: ThemeChoice;
  game?: ThemeChoice;
  app?: ThemeChoice;
}

/** The Default app theme: Pride through June, Sunrise the rest of the year. */
export function getAutomaticScheme(date: Date = new Date()): SchemeName {
  return date.getMonth() === 5 ? "pride_traditional" : "default";
}

/**
 * Whether a game's characters have themes of their own. A solo game with one
 * character keeps its theme on the game, so the person sets it once; from a
 * second character on, each can have its own, as in shared games. Outside a
 * game every character can.
 *
 * Moving there: a solo game with one character whose game has no theme takes
 * that character's theme as the game's, once, when this ships.
 */
export function charactersHaveThemes(
  game: { solo?: boolean } | undefined,
  characterCount: number,
): boolean {
  return !game?.solo || characterCount > 1;
}

/**
 * The theme in effect: the character's, else the game's, else the person's
 * app theme, else Default (the seasonal theme).
 */
export function resolveTheme(
  levels: ThemeLevels,
  date: Date = new Date(),
): ResolvedTheme {
  if (levels.character) {
    return { scheme: levels.character, source: "character" };
  }
  if (levels.game) return { scheme: levels.game, source: "game" };
  if (levels.app) return { scheme: levels.app, source: "app" };
  return { scheme: getAutomaticScheme(date), source: "automatic" };
}
