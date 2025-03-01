import { useDataswornTreeStore } from "@/stores/dataswornTree.store";
import { Datasworn } from "@datasworn/core";

export function useAssetCollection(
  assetCollectionId: string,
): Datasworn.AssetCollection | undefined {
  return useDataswornTreeStore(
    (store) => store.assets.assetCollectionMap[assetCollectionId],
  );
}
