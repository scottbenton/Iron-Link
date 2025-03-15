import { AssetCardDialog } from "@/components/datasworn/AssetCardDialog";
import { GridLayout } from "@/components/layout/GridLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useCharacterIdOptional } from "@/hooks/useCharacterId";
import { useGameId } from "@/hooks/useGameId";
import { useIsOwnerOfCharacter } from "@/hooks/usePermissions";
import { IAsset } from "@/services/asset.service";
import { useAssetsStore } from "@/stores/assets.store";
import { Bleed, Box, Button, Heading, Stack } from "@chakra-ui/react";
import { useCallback, useState } from "react";

import { AssetsSectionCard } from "./AssetsSectionCard";

export function AssetTabContents() {
  const t = useGameTranslations();
  const gameId = useGameId();
  const characterId = useCharacterIdOptional();

  const [showAllAbilities, setShowAllAbilities] = useState(false);
  const [assetCardDialogOpen, setAssetCardDialogOpen] = useState(false);

  const { sharedAssets, lastSharedAssetOrder } = useAssetsStore((store) => {
    const sortedAssetIds: string[] = [];
    let lastSharedAssetOrder = 0;

    Object.entries(store.assets)
      .filter(([, asset]) => asset.characterId === null)
      .sort(([, a1], [, a2]) => a1.order - a2.order)
      .forEach(([assetId, asset]) => {
        sortedAssetIds.push(assetId);
        lastSharedAssetOrder = asset.order;
      });

    return { sharedAssets: sortedAssetIds, lastSharedAssetOrder };
  });

  const { characterAssets, lastCharacterAssetOrder } = useAssetsStore(
    (store) => {
      const sortedAssetIds: string[] = [];
      let lastCharacterAssetOrder = 0;

      Object.entries(store.assets)
        .filter(([, asset]) => asset.characterId !== null)
        .sort(([, a1], [, a2]) => a1.order - a2.order)
        .forEach(([assetId, asset]) => {
          sortedAssetIds.push(assetId);
          lastCharacterAssetOrder = asset.order;
        });

      return { characterAssets: sortedAssetIds, lastCharacterAssetOrder };
    },
  );

  const createAsset = useAssetsStore((store) => store.addAsset);
  const handleAssetCreate = useCallback(
    (
      asset: Omit<IAsset, "order" | "id" | "characterId" | "gameId">,
      shared: boolean,
    ) => {
      if (!characterId) return;
      const sharedAssetOrder = lastSharedAssetOrder + 1;
      const characterAssetOrder = lastCharacterAssetOrder + 1;
      setAssetCardDialogOpen(false);
      createAsset({
        ...asset,
        order: shared ? sharedAssetOrder : characterAssetOrder,
        gameId,
        characterId: shared ? null : characterId,
      }).catch((e) => console.error(e));
    },
    [
      lastCharacterAssetOrder,
      lastSharedAssetOrder,
      createAsset,
      gameId,
      characterId,
    ],
  );

  const isOwnerOfCharacter = useIsOwnerOfCharacter();

  return (
    <>
      <Box>
        <Bleed
          inline={4}
          px={4}
          mt={-2}
          h={12}
          justifyContent="space-between"
          display="flex"
          alignItems={"center"}
          bg="bg.muted"
        >
          <Checkbox
            checked={showAllAbilities}
            onCheckedChange={(details) =>
              setShowAllAbilities(details.checked === true)
            }
          >
            {t("assets-tab-show-all-abilities-checkbox", "Show all abilities")}
          </Checkbox>
          {characterId && (
            <Button
              colorPalette="gray"
              variant="outline"
              onClick={() => setAssetCardDialogOpen(true)}
            >
              Add Asset
            </Button>
          )}
        </Bleed>
        <Stack mt={4}>
          {characterId && (
            <GridLayout
              items={characterAssets}
              renderItem={(assetId) => (
                <AssetsSectionCard
                  key={assetId}
                  doesUserOwnCharacter={isOwnerOfCharacter}
                  assetId={assetId}
                  showUnavailableAbilities={showAllAbilities}
                />
              )}
              minWidth={300}
            />
          )}
          {sharedAssets.length > 0 && (
            <Box>
              <Heading>{t("shared-asset-heading", "Shared Assets")}</Heading>
              <GridLayout
                items={sharedAssets}
                renderItem={(assetId) => (
                  <AssetsSectionCard
                    key={assetId}
                    doesUserOwnCharacter={isOwnerOfCharacter}
                    assetId={assetId}
                    showUnavailableAbilities={showAllAbilities}
                  />
                )}
                minWidth={300}
              />
            </Box>
          )}
        </Stack>
      </Box>
      <AssetCardDialog
        open={assetCardDialogOpen}
        onClose={() => setAssetCardDialogOpen(false)}
        handleAssetSelection={handleAssetCreate}
      />
    </>
  );
}
