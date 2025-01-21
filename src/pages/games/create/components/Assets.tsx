import RemoveAssetIcon from "@mui/icons-material/Close";
import { Button, IconButton } from "@mui/material";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { GridLayout } from "components/Layout";
import { AssetCard } from "components/datasworn/AssetCard";
import { AssetCardDialog } from "components/datasworn/AssetCardDialog/AssetCardDialog";

import {
  IAssetWithoutAdditives,
  useCreateCharacterStore,
} from "stores/createCharacter.store";

export function Assets() {
  const characterAssets = useCreateCharacterStore(
    (store) => store.characterAssets,
  );
  const gameAssets = useCreateCharacterStore((store) => store.gameAssets);

  const addAsset = useCreateCharacterStore((store) => store.addAsset);

  const { t } = useTranslation();

  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);

  const combinedAssets = [...gameAssets, ...characterAssets];

  return (
    <>
      <GridLayout
        sx={{ mt: 2 }}
        items={combinedAssets}
        renderItem={(assetDocument, index) => (
          <AssetGridCard
            index={
              index >= gameAssets.length ? index - gameAssets.length : index
            }
            shared={index < gameAssets.length}
            assetDocument={assetDocument}
          />
        )}
        minWidth={300}
        emptyStateMessage={t(
          "character.create.add-asset-empty-state",
          "Add an asset now, or add one later from the character sheet.",
        )}
        emptyStateAction={
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setIsAddAssetDialogOpen(true)}
          >
            {t("character.create.add-asset", "Add Asset")}
          </Button>
        }
      />
      {combinedAssets.length > 0 && (
        <div>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setIsAddAssetDialogOpen(true)}
            sx={{ mt: 2 }}
          >
            {t("character.create.add-asset", "Add Asset")}
          </Button>
        </div>
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

interface AssetGridCardProps {
  index: number;
  assetDocument: IAssetWithoutAdditives;
  shared: boolean;
}

function AssetGridCard(props: AssetGridCardProps) {
  const { index, assetDocument, shared } = props;
  const { t } = useTranslation();

  const toggleAssetAbility = useCreateCharacterStore(
    (store) => store.toggleAssetAbility,
  );
  const updateAssetControl = useCreateCharacterStore(
    (store) => store.updateAssetControl,
  );
  const updateAssetOption = useCreateCharacterStore(
    (store) => store.updateAssetOption,
  );
  const removeAsset = useCreateCharacterStore((store) => store.removeAsset);

  const handleAssetAbilityToggle = useCallback(
    (abilityIndex: number, checked: boolean) => {
      toggleAssetAbility(index, abilityIndex, checked, shared);
    },
    [toggleAssetAbility, index, shared],
  );

  const handleAssetControlChange = useCallback(
    (controlKey: string, value: string | boolean | number) => {
      updateAssetControl(index, controlKey, value, shared);
    },
    [updateAssetControl, index, shared],
  );

  const handleAssetOptionChange = useCallback(
    (optionKey: string, value: string) => {
      updateAssetOption(index, optionKey, value, shared);
    },
    [updateAssetOption, index, shared],
  );

  const handleRemoveAsset = useCallback(() => {
    removeAsset(index, shared);
  }, [removeAsset, index, shared]);

  return (
    <AssetCard
      assetId={assetDocument.dataswornAssetId}
      assetDocument={{
        ...assetDocument,
        id: "",
        characterId: null,
        gameId: null,
      }}
      headerActions={
        <IconButton
          aria-label={t("character.assets.remove-asset", "Remove Asset")}
          onClick={handleRemoveAsset}
          color="inherit"
        >
          <RemoveAssetIcon />
        </IconButton>
      }
      onAssetAbilityToggle={handleAssetAbilityToggle}
      onAssetControlChange={handleAssetControlChange}
      onAssetOptionChange={handleAssetOptionChange}
      sx={{ height: "100%", width: "100%" }}
    />
  );
}
