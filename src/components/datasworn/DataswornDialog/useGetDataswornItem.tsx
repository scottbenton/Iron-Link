import { Datasworn } from "@datasworn-community/core";

import { getAsset } from "hooks/datasworn/useAsset";
import { getAssetCollection } from "hooks/datasworn/useAssetCollection";
import { getMove } from "hooks/datasworn/useMove";
import { getOracleCollection } from "hooks/datasworn/useOracleCollection";
import { getOracleRollable } from "hooks/datasworn/useOracleRollable";

import {
  useDataswornTree,
  useDataswornTreeStore,
} from "stores/dataswornTree.store";

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
  useDataswornTree();
  return getDataswornItem(itemId);
}

export function getDataswornItem(itemId: string): ReturnType {
  const oracle = getOracleRollable(itemId);
  if (oracle) {
    return {
      type: "oracle_rollable",
      oracle,
    };
  }

  const oracleCollection = getOracleCollection(itemId);
  if (oracleCollection) {
    return {
      type: "oracle_collection",
      oracleCollection,
    };
  }

  const move = getMove(itemId);
  if (move) {
    return {
      type: "move",
      move,
    };
  }

  const { moveCategoryAliases, moveCategoryMap } =
    useDataswornTreeStore.getState().moves;
  const moveCategory =
    moveCategoryMap[moveCategoryAliases[itemId] ?? itemId] ??
    moveCategoryMap[itemId];
  if (moveCategory) {
    return {
      type: "move_category",
      moveCategory,
    };
  }

  const asset = getAsset(itemId);
  if (asset) {
    return {
      type: "asset",
      asset,
    };
  }

  const assetCollection = getAssetCollection(itemId);
  if (assetCollection) {
    return {
      type: "asset_collection",
      assetCollection,
    };
  }

  return undefined;
}
