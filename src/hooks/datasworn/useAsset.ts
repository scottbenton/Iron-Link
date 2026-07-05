import { Datasworn } from "@datasworn-community/core";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

export function getAsset(assetId: string): Datasworn.Asset | undefined {
  const { assetAliases, assetMap } = useDataswornTreeStore.getState().assets;
  return assetMap[assetAliases[assetId] ?? assetId] ?? assetMap[assetId];
}

export function useAsset(assetId: string): Datasworn.Asset | undefined {
  return useDataswornTreeStore((store) => {
    const resolvedAssetId = store.assets.assetAliases[assetId] ?? assetId;
    return (
      store.assets.assetMap[resolvedAssetId] ?? store.assets.assetMap[assetId]
    );
  });
}
