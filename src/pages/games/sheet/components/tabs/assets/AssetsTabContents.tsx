import { AssetCardDialog } from "@/components/datasworn/AssetCardDialog";
import { GridLayout } from "@/components/layout/GridLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useCharacterIdOptional } from "@/hooks/useCharacterId";
import { useGameId } from "@/hooks/useGameId";
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

  const sharedAssets = useAssetsStore((store) => {
    return Object.entries(store.assets)
      .filter(([, asset]) => asset.characterId === null)
      .sort(([, a1], [, a2]) => a1.order - a2.order);
  });

  const currentCharacterAssets = useAssetsStore((store) => {
    return Object.entries(store.assets)
      .filter(([, asset]) => asset.characterId === characterId)
      .sort(([, a1], [, a2]) => a1.order - a2.order);
  });

  const createAsset = useAssetsStore((store) => store.addAsset);
  const handleAssetCreate = useCallback(
    (
      asset: Omit<IAsset, "order" | "id" | "characterId" | "gameId">,
      shared: boolean,
    ) => {
      if (!characterId) return;
      const sharedAssetOrder =
        sharedAssets.length > 0
          ? sharedAssets[sharedAssets.length - 1][1].order + 1
          : 0;
      const characterAssetOrder =
        currentCharacterAssets.length > 0
          ? currentCharacterAssets[currentCharacterAssets.length - 1][1].order +
            1
          : 0;
      setAssetCardDialogOpen(false);
      createAsset({
        ...asset,
        order: shared ? sharedAssetOrder : characterAssetOrder,
        gameId,
        characterId: shared ? null : characterId,
      }).catch((e) => console.error(e));
    },
    [sharedAssets, currentCharacterAssets, createAsset, gameId, characterId],
  );

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
              items={currentCharacterAssets}
              renderItem={([assetId, asset]) => (
                <AssetsSectionCard
                  key={assetId}
                  doesUserOwnCharacter={
                    asset.characterId
                      ? asset.characterId === characterId
                      : false
                  }
                  assetId={assetId}
                  assetDocument={asset}
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
                renderItem={([assetId, asset]) => (
                  <AssetsSectionCard
                    key={assetId}
                    doesUserOwnCharacter={
                      asset.characterId
                        ? asset.characterId === characterId
                        : false
                    }
                    assetId={assetId}
                    assetDocument={asset}
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
