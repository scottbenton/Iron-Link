import { useWorldOraclesStore } from "stores/worldOracles.store";

// The oracle catalog for the world whose oracles are loaded (see
// useListenToWorldOracles), or a loading state for any other world.
export function useWorldOracles(worldId: string) {
  const oracles = useWorldOraclesStore((store) => {
    const matchesWorld = store.worldId === worldId;
    return {
      catalog: matchesWorld ? store.catalog : null,
      loading: !matchesWorld || store.loading,
      error: matchesWorld ? store.error : undefined,
      allPackages: store.allPackages,
    };
  });
  const setAllPackages = useWorldOraclesStore((store) => store.setAllPackages);
  const retry = useWorldOraclesStore((store) => store.retry);
  return { ...oracles, setAllPackages, retry };
}
