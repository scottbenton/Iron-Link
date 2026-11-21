import { SchemeName } from "ui/theme";

import { ColorScheme } from "repositories/shared.types";

/**
 * The library's scheme for each of the app's colour schemes. They share
 * names; the record makes a scheme added on one side and not the other a
 * type error rather than a silently unthemed library.
 */
export const uiSchemeNames: Record<ColorScheme, SchemeName> = {
  [ColorScheme.Default]: "default",
  [ColorScheme.Cinder]: "cinder",
  [ColorScheme.Eidolon]: "eidolon",
  [ColorScheme.Hinterlands]: "hinterlands",
  [ColorScheme.Myriad]: "myriad",
  [ColorScheme.Mystic]: "mystic",
  [ColorScheme.Orchid]: "orchid",
  [ColorScheme.Gloaming]: "gloaming",
  [ColorScheme.PrideTraditional]: "pride_traditional",
};
