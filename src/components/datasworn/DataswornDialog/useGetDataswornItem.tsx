import { useDataswornTreeStore } from "@/stores/dataswornTree.store";
import { Datasworn } from "@datasworn/core";

type ReturnType =
  | {
      type: "oracle_rollable";
      oracle: Datasworn.OracleRollable | Datasworn.EmbeddedOracleRollable;
    }
  | {
      type: "oracle_collection";
      oracleCollection: Datasworn.OracleCollection;
    }
  | {
      type: "move_category";
      moveCategory: Datasworn.MoveCategory;
    }
  | {
      type: "move";
      move: Datasworn.Move | Datasworn.EmbeddedMove;
    }
  | {
      type: "asset_collection";
      assetCollection: Datasworn.AssetCollection;
    }
  | {
      type: "asset";
      asset: Datasworn.Asset;
    }
  | undefined;

export function useGetDataswornItem(itemId: string): ReturnType {
  return useDataswornTreeStore((store) => {
    if (store.moves.moveCategoryMap[itemId]) {
      return {
        type: "move_category",
        moveCategory: store.moves.moveCategoryMap[itemId],
      };
    }
    if (store.moves.moveMap[itemId]) {
      return {
        type: "move",
        move: store.moves.moveMap[itemId],
      };
    }
    if (store.assets.assetCollectionMap[itemId]) {
      return {
        type: "asset_collection",
        assetCollection: store.assets.assetCollectionMap[itemId],
      };
    }
    if (store.assets.assetMap[itemId]) {
      return {
        type: "asset",
        asset: store.assets.assetMap[itemId],
      };
    }
    if (store.oracles.oracleCollectionMap[itemId]) {
      return {
        type: "oracle_collection",
        oracleCollection: store.oracles.oracleCollectionMap[itemId],
      };
    }
    if (store.oracles.oracleRollableMap[itemId]) {
      return {
        type: "oracle_rollable",
        oracle: store.oracles.oracleRollableMap[itemId],
      };
    }
    return undefined;
  });
}
