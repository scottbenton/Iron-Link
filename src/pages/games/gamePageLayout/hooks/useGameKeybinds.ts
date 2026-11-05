import { useEffect } from "react";

import {
  ModifierKeys,
  useAccessibilityState,
} from "stores/accessibility.store";

export const GAME_TAB_ID = "game-tabs";
// The heading of the character or game overview column (desktop only).
export const OVERVIEW_ID = "game-overview-heading";
// The phone layout's tab for that column.
export const OVERVIEW_MOBILE_TAB_ID = "tab-Outlet";
export const NOTES_ID = "game-notes";
export const REFERENCE_ID = "tab-moves";

// Focuses the first of the ids that is in the page and not in a hidden
// panel.
export function focusFirstElement(ids: string[]) {
  for (const id of ids) {
    const element = document.getElementById(id);
    if (element && !element.closest("[hidden]")) {
      element.focus();
      return true;
    }
  }
  return false;
}

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
          focusFirstElement([GAME_TAB_ID]);
        } else if (eventKey === "overview-section") {
          focusFirstElement([OVERVIEW_ID, OVERVIEW_MOBILE_TAB_ID]);
        } else if (eventKey === "notes-section") {
          focusFirstElement([NOTES_ID]);
        } else if (eventKey === "reference-section") {
          focusFirstElement([REFERENCE_ID]);
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
