import { Datasworn } from "@datasworn/core";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  useDataswornTree,
  useDataswornTreeStore,
} from "stores/dataswornTree.store";
import { getRulesetFromId } from "stores/dataswornTreeHelpers/getRulesetFromId";

import { source } from "data/askTheOracle";

import { useActiveAssets } from "./useActiveAssets";

export function useActiveAssetMoveCategories(): Record<
  string,
  Datasworn.MoveCategory
> {
  const { t } = useTranslation();

  const { characterAssets, gameAssets } = useActiveAssets();
  const assetMap = useDataswornTreeStore((store) => store.assets.assetMap);

  const tree = useDataswornTree();

  const activeAssetMoves = useMemo(() => {
    const moves: Record<string, Record<string, Datasworn.EmbeddedMove>> = {};
    Object.values({
      ...characterAssets,
      ...gameAssets,
    }).forEach((assetDocument) => {
      const asset = assetMap[assetDocument.id];
      if (!asset) return;

      asset.abilities.forEach((ability, index) => {
        if (ability.enabled || assetDocument.enabledAbilities[index]) {
          Object.entries(ability.moves ?? {}).forEach(([moveId, move]) => {
            const rulesetId = getRulesetFromId(move._id, tree)?.id;
            if (rulesetId) {
              if (!moves[rulesetId]) {
                moves[rulesetId] = {};
              }
              moves[rulesetId][moveId] = move;
            }
          });
        }
      });
    });
    return moves;
  }, [characterAssets, gameAssets, tree, assetMap]);

  const assetMoveCategories = useMemo(() => {
    if (Object.keys(activeAssetMoves).length === 0) return {};

    const categories: Record<string, Datasworn.MoveCategory> = {};

    Object.entries(activeAssetMoves).forEach(([rulesetId, moves]) => {
      categories[rulesetId] = {
        _id: `move_category:${rulesetId}/asset_moves`,
        name: t("datasworn.moves.asset-move-category", "Asset Moves"),
        _source: source,
        contents: moves as Record<string, Datasworn.Move>,
        collections: {},
        type: "move_category",
      };
    });

    return categories;
  }, [activeAssetMoves, t]);

  return assetMoveCategories;
}
