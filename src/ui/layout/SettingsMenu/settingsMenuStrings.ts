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

export const defaultSettingsMenuStrings: SettingsMenuStrings = {
  triggerLabel: "Settings",
  characterTriggerLabel: "Character Settings",
  characterHeading: (characterName) => `${characterName} Settings`,
  gameHeading: "Game Settings",
  appHeading: "App Settings",

  characterDetails: "Change Name or Portrait",
  characterStats: "Update Stats",
  characterAccess: "Edit Access",
  deleteCharacter: "Delete Character",

  gameName: "Edit Game Name",
  gameRulesets: "Edit Rulesets",
  logSound: "Sound on New Log Messages",
  logSoundDescription: "On this device only",
  secondScreen: "Second Screen",
  deleteGame: "Delete Game",

  theme: "Change Theme",
  themeDescription: (scope) =>
    scope === "game"
      ? "Your characters, this game or the app"
      : scope === "solo"
        ? "This game or the app"
        : "The whole app",

  darkMode: "Dark Mode",
  switchColorMode: (to) =>
    to === "dark" ? "Switch to dark mode" : "Switch to light mode",
  accessibility: "Accessibility Settings",
  advancedFeatures: "Advanced Features",
  admin: "Admin Settings",
  signOut: "Sign Out",

  deleteCharacterTitle: (characterName) => `Delete ${characterName}?`,
  deleteCharacterDescription:
    "Their sheet, assets and tracks are deleted with them. This can't be undone.",
  keepCharacter: "Keep Character",
  deleteGameTitle: (gameName) => `Delete ${gameName}?`,
  deleteGameDescription: (solo) =>
    solo
      ? "This can't be undone."
      : "The game is deleted for everyone in it. This can't be undone.",
  keepGame: "Keep Game",
  closeLabel: "Close",
};
