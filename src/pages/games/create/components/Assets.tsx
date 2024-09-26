import { Button, IconButton } from "@mui/material";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { GridLayout } from "components/Layout";
import { AssetCard } from "components/datasworn/AssetCard";
import RemoveAssetIcon from "@mui/icons-material/Close";
import { AssetCardDialog } from "components/datasworn/AssetCardDialog/AssetCardDialog";
import { useCreateCharacterAtom } from "../atoms/createCharacter.atom";
import { AssetDocument } from "api-calls/assets/_asset.type";

export function Assets() {
  const [character, setCharacter] = useCreateCharacterAtom();
  const { t } = useTranslation();

  const [isAddAssetDialogOpen, setIsAddAssetDialogOpen] = useState(false);

  const handleAssetControlChange = useCallback(
    (index: number, controlKey: string, value: string | boolean | number) => {
      setCharacter((prev) => {
        const newAssets = [...prev.assets];
        const newAsset = { ...prev.assets[index] };
        if (!newAsset.controlValues) {
          newAsset.controlValues = {};
        }
        newAsset.controlValues[controlKey] = value;
        newAssets[index] = newAsset;
        return { ...prev, assets: newAssets };
      });
    },
    [setCharacter]
  );

  return (
    <>
      <GridLayout
        sx={{ mt: 2 }}
        items={character.assets}
        renderItem={(assetDocument, index) => (
          <AssetGridCard
            index={index}
            assetDocument={assetDocument}
            setCharacter={setCharacter}
            onAssetControlChange={handleAssetControlChange}
          />
        )}
        minWidth={300}
        emptyStateMessage="Add an asset now, or add one later from the character sheet."
        emptyStateAction={
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setIsAddAssetDialogOpen(true)}
          >
            {t("Add Asset")}
          </Button>
        }
      />
      {character.assets.length > 0 && (
        <div>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setIsAddAssetDialogOpen(true)}
            sx={{ mt: 2 }}
          >
            {t("Add Asset")}
          </Button>
        </div>
      )}
      <AssetCardDialog
        open={isAddAssetDialogOpen}
        handleClose={() => setIsAddAssetDialogOpen(false)}
        handleAssetSelection={(asset) => {
          setCharacter((prev) => {
            const newCharacter = { ...prev };
            const existingAssets = newCharacter.assets;
            newCharacter.assets = [
              ...newCharacter.assets,
              {
                ...asset,
                order:
                  existingAssets.length > 0
                    ? existingAssets[existingAssets.length - 1].order + 1
                    : 0,
              },
            ];
            return newCharacter;
          });
          setIsAddAssetDialogOpen(false);
        }}
      />
    </>
  );
}

interface AssetGridCardProps {
  index: number;
  assetDocument: AssetDocument;
  setCharacter: ReturnType<typeof useCreateCharacterAtom>[1];
  onAssetControlChange: (
    index: number,
    controlKey: string,
    value: string | boolean | number
  ) => void;
}

function AssetGridCard(props: AssetGridCardProps) {
  const { index, assetDocument, setCharacter, onAssetControlChange } = props;
  const { t } = useTranslation();

  const handleAssetControlChange = useCallback(
    (controlKey: string, value: string | boolean | number) => {
      onAssetControlChange(index, controlKey, value);
    },
    [onAssetControlChange, index]
  );

  return (
    <AssetCard
      assetId={assetDocument.id}
      assetDocument={assetDocument}
      headerActions={
        <IconButton
          aria-label={t("Remove Asset")}
          onClick={() =>
            setCharacter((prev) => {
              const newAssets = [...prev.assets];
              newAssets.splice(index, 1);
              return { ...prev, assets: newAssets };
            })
          }
        >
          <RemoveAssetIcon />
        </IconButton>
      }
      onAssetAbilityToggle={(abilityIndex, checked) => {
        setCharacter((prev) => {
          const newAssets = [...prev.assets];
          const newAsset = { ...prev.assets[index] };
          newAsset.enabledAbilities[abilityIndex] = checked;
          newAssets[index] = newAsset;
          return { ...prev, assets: newAssets };
        });
      }}
      onAssetControlChange={handleAssetControlChange}
      onAssetOptionChange={(optionKey, value) => {
        setCharacter((prev) => {
          const newAssets = [...prev.assets];
          const newAsset = { ...prev.assets[index] };
          if (!newAsset.optionValues) {
            newAsset.optionValues = {};
          }
          newAsset.optionValues[optionKey] = value;
          newAssets[index] = newAsset;
          return { ...prev, assets: newAssets };
        });
      }}
      sx={{ height: "100%", width: "100%" }}
    />
  );
}