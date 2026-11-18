import type { SchemeName } from "./schemes";

export type UIColorMode = "light" | "dark";

export interface UIThemeAttributes {
  mode: UIColorMode;
  scheme: SchemeName;
}

/**
 * Writes the colour mode and scheme where the library's tokens read them:
 * `data-theme` and `data-panda-theme` on <html>. The Default scheme is the
 * token values themselves, so it removes the scheme attribute.
 */
export function applyUITheme(
  attributes: UIThemeAttributes,
  element: HTMLElement = document.documentElement,
) {
  element.dataset.theme = attributes.mode;
  if (attributes.scheme === "default") {
    delete element.dataset.pandaTheme;
  } else {
    element.dataset.pandaTheme = attributes.scheme;
  }
  element.style.colorScheme = attributes.mode;
}
