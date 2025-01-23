import { useAdvancedFeatureToggle } from "./advancedFeatures";

export function useSecondScreenFeature() {
  return useAdvancedFeatureToggle("secondScreen");
}
