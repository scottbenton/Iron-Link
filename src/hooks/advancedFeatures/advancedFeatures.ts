import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { GamePermission, useGameStore } from "stores/game.store";

import { i18n } from "i18n/config";

interface AdvancedFeature {
  name: string;
  description: string;
  requiresGuideRole?: boolean;
}

export type FeatureKey = "secondScreen" | "worlds" | "socialLogin";

export const advancedFeaturesLocalStorageKey =
  "iron-link-advanced-feature-toggles";

export const advancedFeatures: Record<FeatureKey, AdvancedFeature> = {
  secondScreen: {
    name: i18n.t("advanced-features.second-screen", "Second Screen Options"),
    description: i18n.t(
      "advanced-features.second-screen-description",
      "Adds toggles for guide-level players to display images, characters, and more on a player-facing screen.",
    ),
    requiresGuideRole: true,
  },
  worlds: {
    name: i18n.t("advanced-features.worlds", "Worlds (Beta)"),
    description: i18n.t(
      "advanced-features.worlds-description",
      "Enables in-progress worldbuilding features: creating worlds and linking them to your games.",
    ),
  },
  socialLogin: {
    name: i18n.t(
      "advanced-features.social-login",
      "Sign in with Google & Discord (Beta)",
    ),
    description: i18n.t(
      "advanced-features.social-login-description",
      "Adds Google and Discord sign in options to the login page. If your Google or Discord account uses the same email as your existing account, you'll be signed in to that account.",
    ),
  },
};

const defaultToggles: Record<FeatureKey, boolean> = {
  secondScreen: false,
  worlds: false,
  socialLogin: false,
};

export const useAdvancedFeatureToggles = create<{
  toggles: Record<FeatureKey, boolean>;
  updateToggle: (feature: FeatureKey, value: boolean) => void;
}>()(
  persist(
    immer((set) => ({
      toggles: { ...defaultToggles },
      updateToggle: (feature, value) => {
        set((state) => {
          state.toggles[feature] = value;
        });
      },
    })),
    {
      name: advancedFeaturesLocalStorageKey,
      storage: createJSONStorage(() => localStorage),
      // Persisted toggles saved before a feature existed won't contain its
      // key. Fill any missing keys from the defaults so every feature reads
      // as a boolean.
      merge: (persistedState, currentState) => {
        const persistedToggles =
          (persistedState as { toggles?: Partial<Record<FeatureKey, boolean>> })
            ?.toggles ?? {};
        return {
          ...currentState,
          toggles: { ...defaultToggles, ...persistedToggles },
        };
      },
    },
  ),
);

export function useAdvancedFeatureToggle(feature: FeatureKey) {
  const definition = advancedFeatures[feature];

  const enabled = useAdvancedFeatureToggles((state) => state.toggles[feature]);
  const isGuide = useGameStore(
    (store) => store.gamePermissions === GamePermission.Guide,
  );

  if (definition.requiresGuideRole && !isGuide) {
    return false;
  }
  return enabled;
}
