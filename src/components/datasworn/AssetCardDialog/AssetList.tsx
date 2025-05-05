import { Datasworn } from "@datasworn/core";
import { Box, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

import { GridLayout } from "components/Layout";
import { MarkdownRenderer } from "components/MarkdownRenderer";

import { AssetMap } from "stores/dataswornTree.store";

import { IAsset } from "services/asset.service";

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
    <Box>
      {assetCollection.name}
      {assetCollection.description && (
        <MarkdownRenderer markdown={assetCollection.description} />
      )}
      <GridLayout
        items={Object.values(assetCollection.contents)
          .sort((a1, a2) => a1.name.localeCompare(a2.name))
          .map((asset) => asset._id)}
        renderItem={(assetId) => (
          <AssetCard
            assetId={assetId}
            actions={
              <Button
                color={"inherit"}
                variant="outlined"
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
    </Box>
  );
}
