import { useMemo } from "react";

import { useWorldOracles } from "hooks/useWorldOracles";

import { createWorldOracleLookup } from "lib/worldOracleRoll";

// The world's oracle catalog and a lookup that rolls from it. Both are empty
// while the catalog loads, so nothing offers dice until it can roll.
export function useWorldOracleRoller(worldId: string) {
  const { catalog } = useWorldOracles(worldId);
  const lookup = useMemo(
    () => (catalog ? createWorldOracleLookup(catalog) : () => undefined),
    [catalog],
  );
  return { catalog, lookup };
}
