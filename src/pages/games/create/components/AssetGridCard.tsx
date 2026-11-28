import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { AssetCard } from "components/datasworn/AssetCard";

import { IconButton } from "ui/components/IconButton";
import { XIcon } from "ui/icons";

import { useAsset } from "hooks/datasworn/useAsset";

import {
  IAssetWithoutAdditives,
  useCreateCharacterStore,
} from "stores/createCharacter.store";

// One asset a new character starts with, editable and removable. `shared`
// assets belong to the game; `index` is the asset's place in its list.
export interface AssetGridCardProps {
  index: number;
  assetDocument: IAssetWithoutAdditives;
  shared: boolean;
}

export function AssetGridCard(props: AssetGridCardProps) {
  const { index, assetDocument, shared } = props;
  const { t } = useTranslation();
  const assetName = useAsset(assetDocument.dataswornAssetId)?.name;

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
          size="sm"
          label={
            assetName
              ? t("character.assets.remove-named-asset", "Remove {{name}}", {
                  name: assetName,
                })
              : t("character.assets.remove-asset", "Remove Asset")
          }
          onClick={handleRemoveAsset}
        >
          <XIcon />
        </IconButton>
      }
      onAssetAbilityToggle={handleAssetAbilityToggle}
      onAssetControlChange={handleAssetControlChange}
      onAssetOptionChange={handleAssetOptionChange}
      css={{ height: "full", width: "full" }}
    />
  );
}
