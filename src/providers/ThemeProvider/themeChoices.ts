import type { SchemeName } from "ui/theme";

import { ColorScheme } from "repositories/shared.types";

import { uiSchemeNames } from "./uiSchemeNames";

const colorSchemesByUIName = Object.fromEntries(
  Object.entries(uiSchemeNames).map(([scheme, name]) => [name, scheme]),
) as Record<SchemeName, ColorScheme>;

/** A stored theme as the library's Theme dialog takes it. */
export function toThemeChoice(
  colorScheme: ColorScheme | null | undefined,
): SchemeName | null {
  return colorScheme ? uiSchemeNames[colorScheme] : null;
}

/** A Theme dialog choice as the app stores it. */
export function toColorScheme(choice: SchemeName | null): ColorScheme | null {
  return choice ? (colorSchemesByUIName[choice] ?? null) : null;
}
