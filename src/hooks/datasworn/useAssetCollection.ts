import { Datasworn } from "@datasworn/core";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

export function useAssetCollection(
  assetCollectionId: string,
): Datasworn.AssetCollection | undefined {
  return useDataswornTreeStore(
    (store) => store.assets.assetCollectionMap[assetCollectionId],
  );
}
