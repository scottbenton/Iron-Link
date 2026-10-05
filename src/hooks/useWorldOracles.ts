import { useCallback } from "react";

import { useWorldResourcesStore } from "stores/worldResources.store";

/** Reads oracle resources owned by the active world subscription. */
export function useWorldOracles(worldId: string) {
  const oracles = useWorldResourcesStore((store) => {
    const matchesWorld = store.worldId === worldId;
    return {
      worldId,
      catalog: matchesWorld ? store.catalog : null,
      loading: !matchesWorld || store.loading,
      error: matchesWorld ? store.error : undefined,
      allPackages: matchesWorld && store.allPackages,
    };
  });
  const setAllPackages = useWorldResourcesStore(
    (store) => store.setAllPackages,
  );
  const refresh = useWorldResourcesStore((store) => store.refresh);
  const updateAllPackages = useCallback(
    (value: boolean) => setAllPackages(worldId, value),
    [worldId, setAllPackages],
  );
  const retry = useCallback(() => refresh(worldId), [worldId, refresh]);
  return { ...oracles, setAllPackages: updateAllPackages, retry };
}
