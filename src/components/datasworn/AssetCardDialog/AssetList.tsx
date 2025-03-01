import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";
import { GridLayout } from "@/components/layout/GridLayout";
import { IAsset } from "@/services/asset.service";
import { AssetMap } from "@/stores/dataswornTree.store";
import { Button } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";
import { useTranslation } from "react-i18next";

import { AssetCard } from "../AssetCard/AssetCard";

export interface AssetListProps {
  assetCollection: Datasworn.AssetCollection;
  selectAsset: (
    asset: Omit<IAsset, "order" | "id" | "characterId" | "gameId">,
    shared: boolean,
  ) => void;
  assetMap: AssetMap;
}

export function AssetList(props: AssetListProps) {
  const { assetCollection, assetMap, selectAsset } = props;

  const { t } = useTranslation();

  return (
    <div>
      {assetCollection.name}
      {assetCollection.description && (
        <MarkdownRenderer markdown={assetCollection.description} />
      )}
      <GridLayout
        items={Object.values(assetCollection.contents).map(
          (asset) => asset._id,
        )}
        renderItem={(assetId) => (
          <AssetCard
            assetId={assetId}
            actions={
              <Button
                colorPalette="gray"
                variant="subtle"
                onClick={() => {
                  selectAsset(
                    {
                      dataswornAssetId: assetId,
                      enabledAbilities: {},
                      controlValues: {},
                      optionValues: {},
                    },
                    assetMap[assetId].shared,
                  );
                }}
              >
                {t("character.select-asset", "Select Asset")}
              </Button>
            }
          />
        )}
        emptyStateMessage={t(
          "datasworn.no-assets-in-collection",
          "No assets found in collection",
        )}
        minWidth={300}
      />
    </div>
  );
}
