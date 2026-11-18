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
 * not apply: `character` outside a character, `game` in a solo game (whose
 * characters fall straight back to the app theme).
 */
export interface ThemeLevels {
  character?: ThemeChoice;
  game?: ThemeChoice;
  app?: ThemeChoice;
}

/** The Automatic app theme: Pride through June, Default the rest of the year. */
export function getAutomaticScheme(date: Date = new Date()): SchemeName {
  return date.getMonth() === 5 ? "pride_traditional" : "default";
}

/**
 * The theme in effect: the character's, else the game's, else the person's
 * app theme, else Automatic.
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
