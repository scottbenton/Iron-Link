/** The character open now, when the person can edit it. */
export interface SettingsMenuCharacter {
  name: string;
  /**
   * The person owns the character: Edit Access (outside solo games) and
   * Delete Character. Someone it was shared with gets the rest.
   */
  isOwner: boolean;
}

/** The game the page is in. */
export interface SettingsMenuGame {
  name: string;
  /**
   * The person can change the game: its Guides, and everyone in a solo or
   * co-op game (the app's Guide permission). Others get only what applies
   * to them, such as the log sound.
   */
  isGuide: boolean;
  /** A solo game: no log sound setting and no Edit Access. */
  solo?: boolean;
  /**
   * How many characters a solo game has. With one, the game holds the
   * theme (Change Theme covers this game and the app); from two on, each
   * character can have its own again. Defaults to 1.
   */
  characterCount?: number;
  /** Second Screen is turned on in Advanced Features. */
  secondScreen?: boolean;
}

/** What the menu needs to know to decide which items apply. */
export interface SettingsMenuContext {
  /** Leave out when no character is open or the person can't edit it. */
  character?: SettingsMenuCharacter;
  /** Leave out outside a game, such as on the games list. */
  game?: SettingsMenuGame;
  /** Admins get Admin Settings. */
  isAdmin?: boolean;
  /** Signed in people get Sign Out. Defaults to true. */
  signedIn?: boolean;
  /**
   * Leaves Dark Mode out of App Settings, for the nav rail, where
   * `ColorModeToggle` sits above the gear. Phones keep the item.
   */
  hideColorMode?: boolean;
  /**
   * Leaves Change Theme out, where nothing it would open applies: outside a
   * game the app has no theme of its own yet.
   */
  hideTheme?: boolean;
}

export type SettingsMenuItemId =
  | "characterDetails"
  | "characterStats"
  | "characterAccess"
  | "deleteCharacter"
  | "gameName"
  | "gameRulesets"
  | "logSound"
  | "secondScreen"
  | "deleteGame"
  | "theme"
  | "colorMode"
  | "accessibility"
  | "advancedFeatures"
  | "admin"
  | "signOut";

/**
 * An item the caller handles. Deletes go through the menu's own confirm
 * (`onDeleteCharacter`, `onDeleteGame`) and the two checkboxes through
 * `onColorModeChange` and `onLogSoundChange`, so they are not actions.
 */
export type SettingsMenuAction = Exclude<
  SettingsMenuItemId,
  "deleteCharacter" | "deleteGame" | "colorMode" | "logSound"
>;

export type SettingsMenuSectionId = "character" | "game" | "theme" | "app";

export interface SettingsMenuSection {
  id: SettingsMenuSectionId;
  items: SettingsMenuItemId[];
}

/** The character's own items, Delete Character last. */
export function getCharacterItems(
  character: SettingsMenuCharacter,
  game?: SettingsMenuGame,
): SettingsMenuItemId[] {
  const items: SettingsMenuItemId[] = ["characterDetails", "characterStats"];
  if (character.isOwner && !game?.solo) items.push("characterAccess");
  if (character.isOwner) items.push("deleteCharacter");
  return items;
}

/** The game's items, Delete Game last. Empty for a non-Guide in a solo game. */
export function getGameItems(game: SettingsMenuGame): SettingsMenuItemId[] {
  const items: SettingsMenuItemId[] = [];
  if (game.isGuide) items.push("gameName", "gameRulesets");
  if (!game.solo) items.push("logSound");
  if (game.secondScreen) items.push("secondScreen");
  if (game.isGuide) items.push("deleteGame");
  return items;
}

/**
 * The combined menu's sections in order, each only where it applies: this
 * character, this game, Theme (one item for every level), then the app.
 */
export function getSettingsMenuSections(
  context: SettingsMenuContext,
): SettingsMenuSection[] {
  const {
    character,
    game,
    isAdmin,
    signedIn = true,
    hideColorMode,
    hideTheme,
  } = context;
  const sections: SettingsMenuSection[] = [];

  if (character) {
    sections.push({
      id: "character",
      items: getCharacterItems(character, game),
    });
  }
  if (game) {
    const items = getGameItems(game);
    if (items.length > 0) sections.push({ id: "game", items });
  }
  if (!hideTheme) sections.push({ id: "theme", items: ["theme"] });

  const app: SettingsMenuItemId[] = hideColorMode ? [] : ["colorMode"];
  app.push("accessibility", "advancedFeatures");
  if (isAdmin) app.push("admin");
  if (signedIn) app.push("signOut");
  sections.push({ id: "app", items: app });

  return sections;
}

/**
 * The character column's shortcut menu: only that character's actions, with
 * Theme before Delete Character.
 */
export function getCharacterMenuItems(
  character: SettingsMenuCharacter,
  game?: SettingsMenuGame,
): SettingsMenuItemId[] {
  const items = getCharacterItems(character, game);
  const deleteIndex = items.indexOf("deleteCharacter");
  items.splice(deleteIndex === -1 ? items.length : deleteIndex, 0, "theme");
  return items;
}
