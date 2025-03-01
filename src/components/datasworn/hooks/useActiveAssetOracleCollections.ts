import { source } from "@/data/askTheOracle";
import {
  useDataswornTree,
  useDataswornTreeStore,
} from "@/stores/dataswornTree.store";
import { getRulesetFromId } from "@/stores/dataswornTreeHelpers/getRulesetFromId";
import { Datasworn } from "@datasworn/core";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useActiveAssets } from "./useActiveAssets";

export function useActiveAssetOracleCollections(): Record<
  string,
  Datasworn.OracleTablesCollection
> {
  const { t } = useTranslation();

  const { characterAssets, gameAssets } = useActiveAssets();
  const assetMap = useDataswornTreeStore((store) => store.assets.assetMap);

  const tree = useDataswornTree();

  const activeAssetOracles = useMemo(() => {
    const oracles: Record<
      string,
      Record<string, Datasworn.EmbeddedOracleRollable>
    > = {};
    Object.values({
      ...characterAssets,
      ...gameAssets,
    }).forEach((assetDocument) => {
      const asset = assetMap[assetDocument.dataswornAssetId];
      if (!asset) return;

      asset.abilities.forEach((ability, index) => {
        if (ability.enabled || assetDocument.enabledAbilities[index]) {
          Object.entries(ability.oracles ?? {}).forEach(
            ([oracleKey, oracle]) => {
              const rulesetId = getRulesetFromId(oracle._id, tree)?.id;
              if (rulesetId) {
                if (!oracles[rulesetId]) {
                  oracles[rulesetId] = {};
                }
                oracles[rulesetId][oracleKey] = oracle;
              }
            },
          );
        }
      });
    });
    return oracles;
  }, [characterAssets, gameAssets, tree, assetMap]);

  const assetOracleCollections = useMemo(() => {
    if (Object.keys(activeAssetOracles).length === 0) return {};

    const categories: Record<string, Datasworn.OracleTablesCollection> = {};

    Object.entries(activeAssetOracles).forEach(([rulesetId, oracles]) => {
      categories[rulesetId] = {
        _id: `oracle_collection:${rulesetId}/asset_oracles`,
        name: t("datasworn.oracles.asset-oracle-collection", "Asset Oracles"),
        _source: source,
        contents: oracles as Record<string, Datasworn.OracleRollableTable>,
        collections: {},
        type: "oracle_collection",
        oracle_type: "tables",
      };
    });

    return categories;
  }, [activeAssetOracles, t]);

  return assetOracleCollections;
}
