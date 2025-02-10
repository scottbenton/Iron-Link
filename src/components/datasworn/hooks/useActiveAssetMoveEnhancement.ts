import { Datasworn, IdParser } from "@datasworn/core";
import { Primary } from "@datasworn/core/dist/StringId";
import { useMemo } from "react";

import {
  useDataswornTree,
  useDataswornTreeStore,
} from "stores/dataswornTree.store";

import { useActiveAssets } from "./useActiveAssets";

export interface Enhancement {
  assetId: string;
  assetName: string;
  enhancement: Datasworn.MoveEnhancement;
}

export function useActiveAssetMoveEnhancements(moveId: string): Enhancement[] {
  const { characterAssets, gameAssets } = useActiveAssets();

  const tree = useDataswornTree();
  const assets = useDataswornTreeStore((store) => store.assets.assetMap);

  const activeAssetMoveEnhancements = useMemo(() => {
    const moveEnhancements: Enhancement[] = [];
    Object.values({
      ...characterAssets,
      ...gameAssets,
    }).forEach((assetDocument) => {
      const asset = assets[assetDocument.id];
      if (!asset) return;

      asset.abilities.forEach((ability, index) => {
        if (ability.enabled || assetDocument.enabledAbilities[index]) {
          ability.enhance_moves?.forEach((moveEnhancement) => {
            moveEnhancements.push({
              assetId: assetDocument.id,
              assetName: asset.name,
              enhancement: moveEnhancement,
            });
          });
        }
      });
    });
    return moveEnhancements;
  }, [characterAssets, gameAssets, assets]);

  const moveEnhancements = useMemo(() => {
    return activeAssetMoveEnhancements.filter(({ enhancement }) => {
      return (
        !enhancement.enhances ||
        enhancement.enhances?.some((wildcardId) => {
          const matches = IdParser.getMatches(wildcardId as Primary, tree);
          return matches.has(moveId);
        })
      );
    });
  }, [activeAssetMoveEnhancements, moveId, tree]);

  return moveEnhancements;
}
