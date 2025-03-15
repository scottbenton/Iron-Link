import { AssetCard } from "@/components/datasworn/AssetCard";
import { Tooltip } from "@/components/ui/tooltip";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGamePermissions } from "@/hooks/usePermissions";
import { useConfirm } from "@/providers/ConfirmProvider";
import { useAssetsStore } from "@/stores/assets.store";
import { GamePermission } from "@/stores/game.store";
import { IconButton } from "@chakra-ui/react";
import { Trash } from "lucide-react";
import React, { useCallback } from "react";

export interface AssetsSectionCardProps {
  doesUserOwnCharacter: boolean;
  assetId: string;
  showUnavailableAbilities: boolean;
}

function AssetsSectionCardUnMemoized(props: AssetsSectionCardProps) {
  const { doesUserOwnCharacter, assetId, showUnavailableAbilities } = props;
  const t = useGameTranslations();

  const assetDocument = useAssetsStore((store) => store.assets[assetId]);

  const isGamePlayer =
    useGamePermissions().gamePermission !== GamePermission.Viewer;

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
      message: t(
        "character.character-sidebar.delete-asset-dialog-description",
        "Are you sure you want to delete this asset?",
      ),
      confirmText: t("common.delete", "Delete"),
    }).then(({ confirmed }) => {
      if (confirmed) {
        deleteAsset(assetId).catch(() => {});
      }
    });
  }, [confirm, t, assetId, deleteAsset]);

  return (
    <AssetCard
      showSharedIcon
      headerActions={
        isGamePlayer ? (
          <Tooltip
            content={t(
              "character.character-sidebar.delete-asset-dialog-title",
              "Delete Asset",
            )}
          >
            <IconButton
              onClick={handleDeleteAsset}
              // colorPalette={"gray"}
              color="fg.inverted"
              _hover={{
                bg: "gray.800",
              }}
              _focus={{
                bg: "gray.800",
              }}
              variant="ghost"
            >
              <Trash />
            </IconButton>
          </Tooltip>
        ) : undefined
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
