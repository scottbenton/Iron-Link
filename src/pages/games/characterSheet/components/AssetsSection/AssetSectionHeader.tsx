import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { AssetCardDialog } from "components/datasworn/AssetCardDialog/AssetCardDialog";

import { Button } from "ui/components/Button";
import { Checkbox } from "ui/components/Checkbox";
import { PlusIcon } from "ui/icons";
import { HStack } from "ui/primitives";

import { useAssetsStore } from "stores/assets.store";

import { IAsset } from "services/asset.service";

export interface AssetsSectionHeaderProps {
  gameId: string;
  characterId: string | undefined;
  showAllAbilities: boolean;
  setShowAllAbilities: (showAllAbilities: boolean) => void;
  lastSharedAssetOrder: number;
  lastCharacterAssetOrder: number;
  canEditCharacter: boolean;
}

export function AssetSectionHeader(props: AssetsSectionHeaderProps) {
  const {
    gameId,
    characterId,
    showAllAbilities,
    setShowAllAbilities,
    lastSharedAssetOrder,
    lastCharacterAssetOrder,
    canEditCharacter,
  } = props;
  const { t } = useTranslation();

  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);

  const addAsset = useAssetsStore((store) => store.addAsset);

  const { error } = useSnackbar();
  const handleAssetSelection = useCallback(
    (
      assetDocument: Omit<IAsset, "order" | "id" | "gameId" | "characterId">,
      shared: boolean,
    ) => {
      if (!shared && !characterId) {
        error(
          t(
            "character.character-sidebar.shared-asset-error",
            "Assets that are not shared can only be added to characters",
          ),
        );
        setIsAssetDialogOpen(false);
        return;
      }
      setIsAssetDialogOpen(false);
      addAsset({
        ...assetDocument,
        gameId: shared ? gameId : null,
        characterId: !shared && characterId ? characterId : null,
        order: shared ? lastSharedAssetOrder + 1 : lastCharacterAssetOrder + 1,
      });
    },
    [
      characterId,
      gameId,
      lastCharacterAssetOrder,
      lastSharedAssetOrder,
      addAsset,
      error,
      t,
    ],
  );

  return (
    <HStack justifyContent="space-between" flexWrap="wrap" gap="2">
      <Checkbox
        size="sm"
        label={t(
          "character.character-sidebar.expand-assets",
          "Show all abilities",
        )}
        checked={showAllAbilities}
        onCheckedChange={setShowAllAbilities}
      />
      {canEditCharacter && (
        <>
          <Button
            size="sm"
            variant="outline"
            startIcon={<PlusIcon />}
            onClick={() => setIsAssetDialogOpen(true)}
          >
            {t("character.character-sidebar.add-assets", "Add Assets")}
          </Button>
          <AssetCardDialog
            open={isAssetDialogOpen}
            handleClose={() => setIsAssetDialogOpen(false)}
            handleAssetSelection={handleAssetSelection}
          />
        </>
      )}
    </HStack>
  );
}
