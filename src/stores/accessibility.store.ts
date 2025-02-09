// Rolls, announcements, datasworn dialog, themes
import deepEqual from "fast-deep-equal";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

export enum ModifierKeys {
  Alt = "Alt",
  Control = "Control",
  Meta = "Meta",
}

interface AccessibilityState {
  modifierKey: ModifierKeys | undefined;
  keybinds: Record<string, string>;
}

interface AccessibilityActions {
  setModifierKey: (modifierKey: ModifierKeys | undefined) => void;
  setKeybind: (action: string, key: string) => void;
}

export const useAccessibilityState = createWithEqualityFn<
  AccessibilityState & AccessibilityActions
>()(
  persist(
    immer((set) => ({
      modifierKey: undefined,
      keybinds: {},

      setModifierKey: (modifierKey) => {
        set((state) => {
          state.modifierKey = modifierKey;
        });
      },
      setKeybind: (action, key) => {
        set((state) => {
          state.keybinds[action] = key;
        });
      },
    })),
    {
      name: "iron-link-accessibility-settings",
    },
  ),
  deepEqual,
);
