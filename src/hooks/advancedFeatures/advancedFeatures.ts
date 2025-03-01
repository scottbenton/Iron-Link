import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { i18n } from "@/lib/i18n";
import { GamePermission, useGameStore } from "@/stores/game.store";

interface AdvancedFeature {
  name: string;
  description: string;
  requiresGuideRole?: boolean;
}

type FeatureKey = "secondScreen";

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
};

export const useAdvancedFeatureToggles = create<{
  toggles: Record<FeatureKey, boolean>;
  updateToggle: (feature: FeatureKey, value: boolean) => void;
}>()(
  persist(
    immer((set) => ({
      toggles: {
        secondScreen: false,
      },
      updateToggle: (feature, value) => {
        set((state) => {
          state.toggles[feature] = value;
        });
      },
    })),
    {
      name: advancedFeaturesLocalStorageKey,
      storage: createJSONStorage(() => localStorage),
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
