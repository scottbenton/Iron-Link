import { TFunction } from "i18next";

/** The game page's focus shortcuts, by their keybind key. */
export function getKeybindActions(t: TFunction): {
  key: string;
  label: string;
}[] {
  return [
    {
      key: "game-bar",
      label: t("a11y.action.game-tabs", "Game Tabs"),
    },
    {
      key: "overview-section",
      label: t(
        "a11y.action.overview-section",
        "Character/Game Overview Sidebar",
      ),
    },
    {
      key: "notes-section",
      label: t("a11y.action.notes-section", "Notes Section"),
    },
    {
      key: "reference-section",
      label: t("a11y.action.reference-section", "Reference Section"),
    },
  ];
}
