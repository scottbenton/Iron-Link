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

export type FeatureKey = "secondScreen" | "worlds";

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
};

const defaultToggles: Record<FeatureKey, boolean> = {
  secondScreen: false,
  worlds: false,
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
      // Persisted toggles may predate a feature (missing key) or outlive it
      // (feature promoted or removed). Start from the defaults and only keep
      // persisted booleans for features that still exist.
      merge: (persistedState, currentState) => {
        const persistedToggles =
          (persistedState as { toggles?: Record<string, unknown> } | undefined)
            ?.toggles ?? {};
        const toggles = { ...defaultToggles };
        (Object.keys(defaultToggles) as FeatureKey[]).forEach((feature) => {
          const value = persistedToggles[feature];
          if (typeof value === "boolean") {
            toggles[feature] = value;
          }
        });
        return { ...currentState, toggles };
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
