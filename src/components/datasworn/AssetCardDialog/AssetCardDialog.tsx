import { Dialog } from "@/components/common/Dialog";
import { GridLayout } from "@/components/layout/GridLayout";
import { useCharacterCreateTranslations } from "@/hooks/i18n/useCharacterCreateTranslations";
import { IAsset } from "@/services/asset.service";
import { useAssets } from "@/stores/dataswornTree.store";
import { RootCollections } from "@/stores/dataswornTreeHelpers/parseCollectionsIntoMaps";
import { Box, Skeleton } from "@chakra-ui/react";
import { useEffect, useState, useTransition } from "react";

import { AssetCollectionSelect } from "./AssetCollectionSelect";
import { AssetCollectionSidebar } from "./AssetCollectionSidebar";
import { AssetList } from "./AssetList";

export interface AssetCardDialogProps {
  open: boolean;
  onClose: () => void;
  handleAssetSelection: (
    asset: Omit<IAsset, "order" | "id" | "characterId" | "gameId">,
    shared: boolean,
  ) => void;
}
export function AssetCardDialog(props: AssetCardDialogProps) {
  const { open, onClose, handleAssetSelection } = props;

  const t = useCharacterCreateTranslations();

  const { rootAssetCollections, assetCollectionMap, assetMap } = useAssets();
  const [selectedAssetCollectionId, setSelectedAssetCollectionId] = useState(
    getFirstAssetCollection(rootAssetCollections),
  );
  const [collection, setCollection] = useState(
    assetCollectionMap[selectedAssetCollectionId],
  );
  const [isPending, startTransition] = useTransition();
  // const collection = assetCollectionMap[selectedAssetCollectionId.collectionId];

  useEffect(() => {
    const firstAssetCollection = getFirstAssetCollection(rootAssetCollections);
    setSelectedAssetCollectionId(firstAssetCollection);
    startTransition(() => {
      setCollection(assetCollectionMap[firstAssetCollection]);
    });
  }, [rootAssetCollections, assetCollectionMap]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title={t("datasworn.assets", "Assets")}
      content={
        <Box display="flex" flexDir={{ base: "column", md: "row" }} gap={2}>
          <Box display={{ base: "block", md: "none" }}>
            <AssetCollectionSelect
              rootAssetCollections={rootAssetCollections}
              collectionMap={assetCollectionMap}
              selectedCollectionId={selectedAssetCollectionId}
              setSelectedCollectionId={(collectionId) => {
                setSelectedAssetCollectionId(collectionId);
                startTransition(() => {
                  setCollection(assetCollectionMap[collectionId]);
                });
              }}
            />
          </Box>
          <Box flexShrink={0} display={{ base: "none", md: "block" }}>
            <AssetCollectionSidebar
              rootAssetCollections={rootAssetCollections}
              collectionMap={assetCollectionMap}
              selectedCollectionId={selectedAssetCollectionId}
              setSelectedCollectionId={(collectionId) => {
                setSelectedAssetCollectionId(collectionId);
                startTransition(() => {
                  setCollection(assetCollectionMap[collectionId]);
                });
              }}
            />
          </Box>
          <Box flexGrow={1}>
            {isPending ? (
              <GridLayout
                items={[1, 2, 3, 4, 5]}
                renderItem={() => <Skeleton height={500} />}
                emptyStateMessage={""}
                minWidth={300}
              />
            ) : (
              <>
                {collection && (
                  <AssetList
                    assetCollection={collection}
                    assetMap={assetMap}
                    selectAsset={handleAssetSelection}
                  />
                )}
              </>
            )}
          </Box>
        </Box>
      }
    />
  );
}

function getFirstAssetCollection(assetCollections: RootCollections) {
  const firstRuleset = Object.keys(assetCollections)[0];

  if (!firstRuleset) return "";

  const firstCollection = assetCollections[firstRuleset].rootCollectionIds[0];

  if (!firstCollection) return "";

  return firstCollection;
}
