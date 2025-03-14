import {
  ModifierKeys,
  useAccessibilityState,
} from "@/stores/accessibility.store";
import { useEffect } from "react";

export const GAME_TAB_ID = "game-tabs";
export const OVERVIEW_ID = "tab-overview";
export const NOTES_ID = "game-notes";
export const REFERENCE_ID = "tab-moves";

export function useGameKeybinds() {
  const modifierKey = useAccessibilityState((state) => state.modifierKey);
  const keybinds = useAccessibilityState((state) => state.keybinds);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const invertedKeybinds = Object.fromEntries(
        Object.entries(keybinds).map(([key, value]) => [value, key]),
      );
      if (modifierKey && invertedKeybinds[event.key]) {
        let isModifierKeyPressed = false;
        if (modifierKey === ModifierKeys.Alt && event.altKey) {
          isModifierKeyPressed = true;
        } else if (modifierKey === ModifierKeys.Control && event.ctrlKey) {
          isModifierKeyPressed = true;
        } else if (modifierKey === ModifierKeys.Meta && event.metaKey) {
          isModifierKeyPressed = true;
        }

        if (!isModifierKeyPressed) return false;

        const eventKey = invertedKeybinds[event.key];
        if (eventKey === "game-bar") {
          document.getElementById(GAME_TAB_ID)?.focus();
        } else if (eventKey === "overview-section") {
          document.getElementById(OVERVIEW_ID)?.focus();
        } else if (eventKey === "notes-section") {
          document.getElementById(NOTES_ID)?.focus();
        } else if (eventKey === "reference-section") {
          document.getElementById(REFERENCE_ID)?.focus();
        }
      }
    }
    if (modifierKey) {
      window.addEventListener("keydown", handleKeydown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [keybinds, modifierKey]);
}
