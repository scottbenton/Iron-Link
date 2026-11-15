import { useMemo } from "react";

import { useMoves, useSpecialTrackRules } from "stores/dataswornTree.store";

import { getWorldBondMechanics } from "lib/worldBonds.lib";

// The current game's bond rules, read from its rules packages.
export function useWorldBondMechanics() {
  const specialTrackRules = useSpecialTrackRules();
  const { moveMap } = useMoves();
  return useMemo(
    () => getWorldBondMechanics(specialTrackRules, moveMap),
    [specialTrackRules, moveMap],
  );
}
