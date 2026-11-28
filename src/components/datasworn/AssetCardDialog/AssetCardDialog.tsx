import { useMemo } from "react";

import { AssetPickerDialog, AssetPickerGroup } from "ui/game/AssetPickerDialog";

import { useAssets } from "stores/dataswornTree.store";

import { IAsset } from "services/asset.service";

export interface AssetCardDialogProps {
  open: boolean;
  handleClose: () => void;
  handleAssetSelection: (
    asset: Omit<IAsset, "order" | "id" | "characterId" | "gameId">,
    shared: boolean,
  ) => void;
}

/**
 * The library's asset picker over the game's rules: one group per asset
 * type, headed by ruleset when the game plays more than one.
 */
export function AssetCardDialog(props: AssetCardDialogProps) {
  const { open, handleClose, handleAssetSelection } = props;

  const { rootAssetCollections, assetCollectionMap } = useAssets();

  const groups = useMemo(() => {
    const result: AssetPickerGroup[] = [];
    Object.values(rootAssetCollections).forEach((ruleset) => {
      ruleset.rootCollectionIds.forEach((collectionId) => {
        const collection = assetCollectionMap[collectionId];
        if (!collection) return;
        result.push({
          id: collectionId,
          name: collection.name,
          source: ruleset.title,
          assets: Object.values(collection.contents ?? {}).sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        });
      });
    });
    return result;
  }, [rootAssetCollections, assetCollectionMap]);

  return (
    <AssetPickerDialog
      open={open}
      onClose={handleClose}
      groups={groups}
      onAdd={(asset) =>
        handleAssetSelection(
          {
            dataswornAssetId: asset._id,
            enabledAbilities: {},
            controlValues: {},
            optionValues: {},
          },
          asset.shared,
        )
      }
    />
  );
}
