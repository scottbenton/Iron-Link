import { useEffect, useSyncExternalStore } from "react";

import { SchemeName, applyUITheme } from "../../theme";
import { SettingsMenuColorMode } from "./settingsMenuStrings";

function subscribeToColorMode(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function readColorMode(): SettingsMenuColorMode {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function writeColorMode(mode: SettingsMenuColorMode) {
  const root = document.documentElement;
  const scheme = (root.dataset.pandaTheme ?? "default") as SchemeName;
  applyUITheme({ mode, scheme }, root);
}

/**
 * The story's colour mode, read from the page so it follows the toolbar,
 * and switched on the page the way the app would. Leaving the story puts
 * back the toolbar's mode, so the next story doesn't inherit it.
 */
export function useStoryColorMode() {
  const colorMode = useSyncExternalStore(
    subscribeToColorMode,
    readColorMode,
    () => "light" as const,
  );
  useEffect(() => {
    const toolbarMode = readColorMode();
    return () => writeColorMode(toolbarMode);
  }, []);
  return [colorMode, writeColorMode] as const;
}
