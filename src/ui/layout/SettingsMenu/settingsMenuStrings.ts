/** Where the Theme item opens the Theme dialog, for its second line. */
export type SettingsMenuThemeScope = "game" | "solo" | "app";

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
  gameNotifications: string;
  secondScreen: string;
  deleteGame: string;

  theme: string;
  /** Under Change Theme: what the Theme dialog covers here. */
  themeDescription: (scope: SettingsMenuThemeScope) => string;

  darkMode: string;
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
  gameNotifications: "Notification Settings",
  secondScreen: "Second Screen",
  deleteGame: "Delete Game",

  theme: "Change Theme",
  themeDescription: (scope) =>
    scope === "game"
      ? "Your characters, this game or the app"
      : scope === "solo"
        ? "Your characters or the app"
        : "The whole app",

  darkMode: "Dark Mode",
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
