import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AssetCardDialog } from "components/datasworn/AssetCardDialog/AssetCardDialog";

import { Button } from "ui/components/Button";
import { CardsIcon, PlusIcon } from "ui/icons";
import { EmptyState } from "ui/layout";
import { Grid, HStack, Stack } from "ui/primitives";

import { useCreateCharacterStore } from "stores/createCharacter.store";

import { AssetGridCard } from "./AssetGridCard";

export function Assets() {
  const characterAssets = useCreateCharacterStore(
    (store) => store.characterAssets,
  );
  const gameAssets = useCreateCharacterStore((store) => store.gameAssets);

  const addAsset = useCreateCharacterStore((store) => store.addAsset);

  const { t } = useTranslation();

  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);

  const addAssetLabel = t("character.create.add-asset", "Add Asset");
  const hasAssets = gameAssets.length + characterAssets.length > 0;

  return (
    <>
      {hasAssets ? (
        <Stack gap="4">
          {/* Cards in a row stretch to the tallest; each card puts the
              spare height above its controls. */}
          <Grid
            gridTemplateColumns="repeat(auto-fill, minmax(min(100%, 300px), 1fr))"
            gap="3"
          >
            {gameAssets.map((asset, index) => (
              <AssetGridCard
                key={`game-${index}`}
                index={index}
                shared
                assetDocument={asset}
              />
            ))}
            {characterAssets.map((asset, index) => (
              <AssetGridCard
                key={`character-${index}`}
                index={index}
                shared={false}
                assetDocument={asset}
              />
            ))}
          </Grid>
          <HStack>
            <Button
              variant="outline"
              startIcon={<PlusIcon />}
              onClick={() => setIsAddAssetDialogOpen(true)}
            >
              {addAssetLabel}
            </Button>
          </HStack>
        </Stack>
      ) : (
        <EmptyState
          size="sm"
          icon={<CardsIcon />}
          message={t(
            "character.create.add-asset-empty-state",
            "Add an asset now, or add one later from the character sheet.",
          )}
          action={
            <Button
              variant="outline"
              startIcon={<PlusIcon />}
              onClick={() => setIsAddAssetDialogOpen(true)}
            >
              {addAssetLabel}
            </Button>
          }
        />
      )}
      <AssetCardDialog
        open={isAddAssetDialogOpen}
        handleClose={() => setIsAddAssetDialogOpen(false)}
        handleAssetSelection={(asset, shared) => {
          addAsset(asset, shared);
          setIsAddAssetDialogOpen(false);
        }}
      />
    </>
  );
}
