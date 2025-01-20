import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Tooltip } from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { AssetCard } from "components/datasworn/AssetCard";

import { useAssetsStore } from "stores/assets.store";

import { IAsset } from "services/asset.service";

export interface AssetsSectionCardProps {
  doesUserOwnCharacter: boolean;
  assetId: string;
  assetDocument: IAsset;
  showUnavailableAbilities: boolean;
}

function AssetsSectionCardUnMemoized(props: AssetsSectionCardProps) {
  const {
    doesUserOwnCharacter,
    assetId,
    assetDocument,
    showUnavailableAbilities,
  } = props;
  const { t } = useTranslation();

  const toggleAssetAbility = useAssetsStore(
    (store) => store.toggleAssetAbility,
  );
  const handleAssetAbilityToggle = useCallback(
    (abilityIndex: number, checked: boolean) => {
      toggleAssetAbility(assetId, abilityIndex, checked).catch(() => {});
    },
    [assetId, toggleAssetAbility],
  );

  const updateAssetOption = useAssetsStore((store) => store.updateAssetOption);
  const handleAssetOptionChange = useCallback(
    (assetOptionKey: string, value: string) => {
      updateAssetOption(assetId, assetOptionKey, value).catch(() => {});
    },
    [assetId, updateAssetOption],
  );

  const updateAssetControl = useAssetsStore(
    (store) => store.updateAssetControl,
  );
  const handleAssetControlChange = useCallback(
    (controlKey: string, controlValue: boolean | string | number) => {
      updateAssetControl(assetId, controlKey, controlValue).catch(() => {});
    },
    [assetId, updateAssetControl],
  );

  const confirm = useConfirm();
  const deleteAsset = useAssetsStore((store) => store.deleteAsset);
  const handleDeleteAsset = useCallback(() => {
    confirm({
      title: t(
        "character.character-sidebar.delete-asset-dialog-title",
        "Delete Asset",
      ),
      description: t(
        "character.character-sidebar.delete-asset-dialog-description",
        "Are you sure you want to delete this asset?",
      ),
      confirmationText: t("common.delete", "Delete"),
    })
      .then(() => {
        deleteAsset(assetId).catch(() => {});
      })
      .catch(() => {});
  }, [confirm, t, assetId, deleteAsset]);

  return (
    <AssetCard
      showSharedIcon
      headerActions={
        <Tooltip
          title={t(
            "character.character-sidebar.delete-asset-dialog-title",
            "Delete Asset",
          )}
        >
          <IconButton onClick={handleDeleteAsset} color="inherit">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      }
      assetId={assetDocument.dataswornAssetId}
      assetDocument={assetDocument}
      onAssetAbilityToggle={
        doesUserOwnCharacter ? handleAssetAbilityToggle : undefined
      }
      onAssetOptionChange={
        doesUserOwnCharacter ? handleAssetOptionChange : undefined
      }
      onAssetControlChange={
        doesUserOwnCharacter ? handleAssetControlChange : undefined
      }
      hideUnavailableAbilities={!showUnavailableAbilities}
    />
  );
}
export const AssetsSectionCard = React.memo(AssetsSectionCardUnMemoized);
