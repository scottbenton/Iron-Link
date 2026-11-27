import { useTranslation } from "react-i18next";

import {
  SettingsMenuStrings,
  getDefaultSettingsMenuStrings,
} from "./settingsMenuStrings";

/** The settings menus' strings, translated, with any overrides on top. */
export function useSettingsMenuStrings(
  overrides?: Partial<SettingsMenuStrings>,
): SettingsMenuStrings {
  const { t } = useTranslation();
  return { ...getDefaultSettingsMenuStrings(t), ...overrides };
}
