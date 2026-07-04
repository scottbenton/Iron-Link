import { Datasworn, IdParser } from "@datasworn-community/core";
import { useEffect, useState } from "react";

import { useDataswornTree } from "stores/dataswornTree.store";

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
      move: Datasworn.Move;
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
  const tree = useDataswornTree();

  const [returnType, setReturnType] = useState<ReturnType>(
    getDataswornItem(itemId, tree),
  );

  useEffect(() => {
    setReturnType(getDataswornItem(itemId, tree));
  }, [tree, itemId]);

  return returnType;
}

function getDataswornItem(
  itemId: string,
  tree: Record<string, Datasworn.RulesPackage>,
): ReturnType {
  try {
    IdParser.tree = tree;
    const item = IdParser.get(itemId);
    if ((item as Datasworn.OracleCollection).type === "oracle_collection") {
      return {
        type: "oracle_collection",
        oracleCollection: item as Datasworn.OracleCollection,
      };
    }
    if ((item as Datasworn.OracleRollable).type === "oracle_rollable") {
      return {
        type: "oracle_rollable",
        oracle: item as Datasworn.OracleRollable,
      };
    }
    if ((item as Datasworn.MoveCategory).type === "move_category") {
      return {
        type: "move_category",
        moveCategory: item as Datasworn.MoveCategory,
      };
    }
    if ((item as Datasworn.Move).type === "move") {
      return {
        type: "move",
        move: item as Datasworn.Move,
      };
    }
    if ((item as Datasworn.AssetCollection).type === "asset_collection") {
      return {
        type: "asset_collection",
        assetCollection: item as Datasworn.AssetCollection,
      };
    }
    if ((item as Datasworn.Asset).type === "asset") {
      return {
        type: "asset",
        asset: item as Datasworn.Asset,
      };
    }
  } catch {
    return undefined;
  }
}
