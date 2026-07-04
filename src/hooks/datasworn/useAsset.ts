import { Datasworn } from "@datasworn-community/core";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

export function getAsset(assetId: string): Datasworn.Asset | undefined {
  return useDataswornTreeStore.getState().assets.assetMap[assetId];
}

export function useAsset(assetId: string): Datasworn.Asset | undefined {
  return useDataswornTreeStore((store) => store.assets.assetMap[assetId]);
}
