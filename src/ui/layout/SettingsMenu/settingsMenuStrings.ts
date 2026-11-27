import type { TFunction } from "i18next";

/** Where the Theme item opens the Theme dialog, for its second line. */
export type SettingsMenuThemeScope = "game" | "solo" | "app";

/** The colour mode now, or the one a control switches to. */
export type SettingsMenuColorMode = "light" | "dark";

/** Every string the settings menus show, with English defaults. */
export interface SettingsMenuStrings {
  /** The rail and phone gear's name and tooltip. */
  triggerLabel: string;
  /** The character column's button. */
  characterTriggerLabel: string;
  /** The game overview's button, beside the game's name. */
  gameTriggerLabel: string;
  characterHeading: (characterName: string) => string;
  gameHeading: string;
  appHeading: string;

  characterDetails: string;
  characterStats: string;
  characterAccess: string;
  deleteCharacter: string;

  gameName: string;
  gameRulesets: string;
  /**
   * The per-device checkbox for the sound on new game log messages (the
   * live app's Notification Settings), and its second line.
   */
  logSound: string;
  logSoundDescription: string;
  secondScreen: string;
  deleteGame: string;

  theme: string;
  /** Under Change Theme: what the Theme dialog covers here. */
  themeDescription: (scope: SettingsMenuThemeScope) => string;

  darkMode: string;
  /** The rail's mode toggle: its name and tooltip, naming what it does. */
  switchColorMode: (to: SettingsMenuColorMode) => string;
  accessibility: string;
  advancedFeatures: string;
  admin: string;
  signOut: string;

  deleteCharacterTitle: (characterName: string) => string;
  deleteCharacterDescription: string;
  keepCharacter: string;
  deleteGameTitle: (gameName: string) => string;
  deleteGameDescription: (solo: boolean) => string;
  keepGame: string;
  closeLabel: string;
}

/** The English defaults, translated through `t`. */
export function getDefaultSettingsMenuStrings(
  t: TFunction,
): SettingsMenuStrings {
  return {
    triggerLabel: t("ui.settings-menu.trigger", "Settings"),
    characterTriggerLabel: t(
      "ui.settings-menu.character-trigger",
      "Character Settings",
    ),
    gameTriggerLabel: t("ui.settings-menu.game-trigger", "Game Settings"),
    characterHeading: (characterName) =>
      t("ui.settings-menu.character-heading", "{{characterName}} Settings", {
        characterName,
      }),
    gameHeading: t("ui.settings-menu.game-heading", "Game Settings"),
    appHeading: t("ui.settings-menu.app-heading", "App Settings"),

    characterDetails: t(
      "ui.settings-menu.character-details",
      "Change Name or Portrait",
    ),
    characterStats: t("ui.settings-menu.character-stats", "Update Stats"),
    characterAccess: t("ui.settings-menu.character-access", "Edit Access"),
    deleteCharacter: t("ui.settings-menu.delete-character", "Delete Character"),

    gameName: t("ui.settings-menu.game-name", "Edit Game Name"),
    gameRulesets: t("ui.settings-menu.game-rulesets", "Edit Rulesets"),
    logSound: t("ui.settings-menu.log-sound", "Sound on New Log Messages"),
    logSoundDescription: t(
      "ui.settings-menu.log-sound-description",
      "On this device only",
    ),
    secondScreen: t("ui.settings-menu.second-screen", "Second Screen"),
    deleteGame: t("ui.settings-menu.delete-game", "Delete Game"),

    theme: t("ui.settings-menu.theme", "Change Theme"),
    themeDescription: (scope) =>
      scope === "game"
        ? t(
            "ui.settings-menu.theme-description-game",
            "Your characters, this game or the app",
          )
        : scope === "solo"
          ? t("ui.settings-menu.theme-description-solo", "This game or the app")
          : t("ui.settings-menu.theme-description-app", "The whole app"),

    darkMode: t("ui.settings-menu.dark-mode", "Dark Mode"),
    switchColorMode: (to) =>
      to === "dark"
        ? t("ui.settings-menu.switch-to-dark", "Switch to dark mode")
        : t("ui.settings-menu.switch-to-light", "Switch to light mode"),
    accessibility: t(
      "ui.settings-menu.accessibility",
      "Accessibility Settings",
    ),
    advancedFeatures: t(
      "ui.settings-menu.advanced-features",
      "Advanced Features",
    ),
    admin: t("ui.settings-menu.admin", "Admin Settings"),
    signOut: t("ui.settings-menu.sign-out", "Sign Out"),

    deleteCharacterTitle: (characterName) =>
      t(
        "ui.settings-menu.delete-character-title",
        "Delete {{characterName}}?",
        {
          characterName,
        },
      ),
    deleteCharacterDescription: t(
      "ui.settings-menu.delete-character-description",
      "Their sheet, assets and tracks are deleted with them. This can't be undone.",
    ),
    keepCharacter: t("ui.settings-menu.keep-character", "Keep Character"),
    deleteGameTitle: (gameName) =>
      t("ui.settings-menu.delete-game-title", "Delete {{gameName}}?", {
        gameName,
      }),
    deleteGameDescription: (solo) =>
      solo
        ? t(
            "ui.settings-menu.delete-game-description-solo",
            "This can't be undone.",
          )
        : t(
            "ui.settings-menu.delete-game-description",
            "The game is deleted for everyone in it. This can't be undone.",
          ),
    keepGame: t("ui.settings-menu.keep-game", "Keep Game"),
    closeLabel: t("ui.common.close", "Close"),
  };
}
