import type { TFunction } from "i18next";

import type { ThemeSource } from "./resolveTheme";

/** Every string ThemeDialog shows, with English defaults, for translation. */
export interface ThemeDialogStrings {
  title: string;
  /** Under the title: the fallback order, with a game and characters. */
  description: string;
  /** Under the title in a solo game with one character (no character rows). */
  soloDescription: string;
  /** Under the title outside a game, with only the app row. */
  appDescription: string;
  charactersHeading: string;
  gameHeading: string;
  appHeading: string;
  /** Under the game's name. */
  gameHint: string;
  /** Under a solo game's name, given whether its characters have rows. */
  soloGameHint: (characterRows: boolean) => string;
  /** Under the game's name when the person can't change it. */
  gameReadOnly: string;
  appTitle: string;
  appHint: string;
  /** Marks the character the person has open. */
  currentCharacter: string;
  sharedBy: (ownerName: string) => string;
  /** Marks a row whose draft differs from what is saved. */
  changed: string;
  change: string;
  /** The Change button's accessible name. */
  changeLabel: (rowName: string) => string;
  /** The scheme list's accessible name. */
  pickerLabel: (rowName: string) => string;
  useGameTheme: string;
  useAppTheme: string;
  /** Under "Use my app theme" on the game row. */
  useAppThemeForGame: string;
  /**
   * The option that sets no app theme. It reads "Default" because what it
   * picks changes with the season.
   */
  automatic: string;
  /** Under Default: what it picks, given whether it is June now. */
  automaticDescription: (isJune: boolean) => string;
  /** Where a row's theme comes from; `own` when the row sets it itself. */
  source: (source: ThemeSource | "own") => string;
  /** A row's theme in effect: "Eidolon, from this game". */
  resolved: (schemeName: string, source: string) => string;
  save: string;
  saving: string;
  cancel: string;
  saveError: string;
}

export function getDefaultThemeDialogStrings(t: TFunction): ThemeDialogStrings {
  return {
    title: t("ui.theme-dialog.title", "Theme"),
    description: t(
      "ui.theme-dialog.description",
      "A character's theme comes first, then the game's, then your app theme.",
    ),
    soloDescription: t(
      "ui.theme-dialog.solo-description",
      "This game's theme comes first, then your app theme.",
    ),
    appDescription: t(
      "ui.theme-dialog.app-description",
      "Games and characters can have themes of their own, which come first.",
    ),
    charactersHeading: t("ui.theme-dialog.characters-heading", "Characters"),
    gameHeading: t("ui.theme-dialog.game-heading", "This game"),
    appHeading: t("ui.theme-dialog.app-heading", "Everywhere"),
    gameHint: t(
      "ui.theme-dialog.game-hint",
      "Everyone in the game sees it, unless their character has a theme.",
    ),
    soloGameHint: (characterRows) =>
      characterRows
        ? t(
            "ui.theme-dialog.solo-game-hint-characters",
            "Your characters use it, unless they have a theme of their own.",
          )
        : t(
            "ui.theme-dialog.solo-game-hint",
            "Your character uses it. With a second character, each can have its own.",
          ),
    gameReadOnly: t(
      "ui.theme-dialog.game-read-only",
      "Only the game's Guides can change its theme.",
    ),
    appTitle: t("ui.theme-dialog.app-title", "Your app theme"),
    appHint: t(
      "ui.theme-dialog.app-hint",
      "Only you see it, in every game and page without a theme of its own.",
    ),
    currentCharacter: t("ui.theme-dialog.current-character", "Open now"),
    sharedBy: (ownerName) =>
      t("ui.theme-dialog.shared-by", "Shared by {{ownerName}}", { ownerName }),
    changed: t("ui.theme-dialog.changed", "Changed"),
    change: t("ui.theme-dialog.change", "Change"),
    changeLabel: (rowName) =>
      t("ui.theme-dialog.change-label", "Change theme for {{rowName}}", {
        rowName,
      }),
    pickerLabel: (rowName) =>
      t("ui.theme-dialog.picker-label", "Theme for {{rowName}}", { rowName }),
    useGameTheme: t("ui.theme-dialog.use-game-theme", "Use the game's theme"),
    useAppTheme: t("ui.theme-dialog.use-app-theme", "Use my app theme"),
    useAppThemeForGame: t(
      "ui.theme-dialog.use-app-theme-for-game",
      "Everyone sees their own app theme",
    ),
    automatic: t("ui.theme-dialog.automatic", "Default"),
    automaticDescription: (isJune) =>
      isJune
        ? t(
            "ui.theme-dialog.automatic-description-june",
            "Changes with the season: Pride through June, then Sunrise",
          )
        : t(
            "ui.theme-dialog.automatic-description",
            "Changes with the season: Sunrise, and Pride through June",
          ),
    source: (source) => {
      switch (source) {
        case "own":
          return t("ui.theme-dialog.source-own", "set here");
        case "character":
          return t("ui.theme-dialog.source-character", "from this character");
        case "game":
          return t("ui.theme-dialog.source-game", "from this game");
        case "app":
          return t("ui.theme-dialog.source-app", "from your app theme");
        case "automatic":
          return t("ui.theme-dialog.source-automatic", "by default");
      }
    },
    resolved: (schemeName, source) =>
      t("ui.theme-dialog.resolved", "{{schemeName}}, {{source}}", {
        schemeName,
        source,
      }),
    save: t("ui.theme-dialog.save", "Save"),
    saving: t("ui.theme-dialog.saving", "Saving"),
    cancel: t("ui.common.cancel", "Cancel"),
    saveError: t(
      "ui.theme-dialog.save-error",
      "Your theme changes weren't saved. Try again.",
    ),
  };
}
