import type { ThemeSource } from "./resolveTheme";

/** Every string ThemeDialog shows, with English defaults, for translation. */
export interface ThemeDialogStrings {
  title: string;
  /** Under the title: the fallback order, with a game. */
  description: string;
  /** Under the title in a solo game, which has no game row. */
  soloDescription: string;
  charactersHeading: string;
  gameHeading: string;
  appHeading: string;
  /** Under the game's name. */
  gameHint: string;
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
  automatic: string;
  /** Under Automatic: what it picks, given whether it is June now. */
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

export const defaultThemeDialogStrings: ThemeDialogStrings = {
  title: "Theme",
  description:
    "A character's theme comes first, then the game's, then your app theme.",
  soloDescription: "A character's theme comes first, then your app theme.",
  charactersHeading: "Characters",
  gameHeading: "This game",
  appHeading: "Everywhere",
  gameHint: "Everyone in the game sees it, unless their character has a theme.",
  gameReadOnly: "Only the game's Guides can change its theme.",
  appTitle: "Your app theme",
  appHint:
    "Only you see it, in every game and page without a theme of its own.",
  currentCharacter: "Open now",
  sharedBy: (ownerName) => `Shared by ${ownerName}`,
  changed: "Changed",
  change: "Change",
  changeLabel: (rowName) => `Change theme for ${rowName}`,
  pickerLabel: (rowName) => `Theme for ${rowName}`,
  useGameTheme: "Use the game's theme",
  useAppTheme: "Use my app theme",
  useAppThemeForGame: "Everyone sees their own app theme",
  automatic: "Automatic",
  automaticDescription: (isJune) =>
    isJune
      ? "Pride through June, then Default"
      : "Default, and Pride through June",
  source: (source) => {
    switch (source) {
      case "own":
        return "set here";
      case "character":
        return "from this character";
      case "game":
        return "from this game";
      case "app":
        return "from your app theme";
      case "automatic":
        return "automatic";
    }
  },
  resolved: (schemeName, source) => `${schemeName}, ${source}`,
  save: "Save",
  saving: "Saving",
  cancel: "Cancel",
  saveError: "Your theme changes weren't saved. Try again.",
};
