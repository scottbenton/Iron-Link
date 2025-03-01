import { useDataswornTreeStore } from "@/stores/dataswornTree.store";
import { Datasworn } from "@datasworn/core";

export function getAsset(assetId: string): Datasworn.Asset | undefined {
  return useDataswornTreeStore.getState().assets.assetMap[assetId];
}

export function useAsset(assetId: string): Datasworn.Asset | undefined {
  return useDataswornTreeStore((store) => store.assets.assetMap[assetId]);
}
