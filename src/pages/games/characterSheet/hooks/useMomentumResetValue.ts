import { useMemo } from "react";

import { useImpactRules } from "stores/dataswornTree.store";
import { useGameCharacter } from "stores/gameCharacters.store";

const BASE_MAX = 10;
const BASE_RESET = 2;

// Each marked impact lowers max momentum by 1. Reset is +2, +1 with one
// impact and 0 with two or more.
export function useMomentumParameters() {
  const impacts = useGameCharacter((character) => character?.debilities ?? {});
  const { impacts: impactRules } = useImpactRules();

  return useMemo(() => {
    const marked = Object.entries(impacts).filter(
      ([key, isActive]) => isActive && impactRules[key],
    ).length;

    return {
      resetValue: Math.max(0, BASE_RESET - marked),
      max: BASE_MAX - marked,
    };
  }, [impacts, impactRules]);
}
