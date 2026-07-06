import { Datasworn } from "@datasworn-community/core";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

export function getAssetCollection(
  assetCollectionId: string,
): Datasworn.AssetCollection | undefined {
  const { assetCollectionAliases, assetCollectionMap } =
    useDataswornTreeStore.getState().assets;
  return (
    assetCollectionMap[assetCollectionAliases[assetCollectionId] ?? assetCollectionId] ??
    assetCollectionMap[assetCollectionId]
  );
}

export function useAssetCollection(
  assetCollectionId: string,
): Datasworn.AssetCollection | undefined {
  return useDataswornTreeStore((store) => {
    const resolvedAssetCollectionId =
      store.assets.assetCollectionAliases[assetCollectionId] ??
      assetCollectionId;
    return (
      store.assets.assetCollectionMap[resolvedAssetCollectionId] ??
      store.assets.assetCollectionMap[assetCollectionId]
    );
  });
}
