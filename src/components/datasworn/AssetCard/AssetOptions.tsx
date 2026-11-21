import { Datasworn } from "@datasworn-community/core";
import { Stack } from "@mui/material";

import { sortByLabel } from "ui/game/AssetCard/assetData";

import { IAsset } from "services/asset.service";

import { AssetOption } from "./AssetOption";

export interface AssetOptionsProps {
  assetDocument?: IAsset;
  options: Record<
    string,
    Datasworn.AssetOptionField | Datasworn.AssetAbilityOptionField
  >;

  onAssetOptionChange?: (assetOptionKey: string, value: string) => void;
}

export function AssetOptions(props: AssetOptionsProps) {
  const { options, assetDocument, onAssetOptionChange } = props;

  if (Object.keys(options).length === 0) {
    return null;
  }

  return (
    <Stack spacing={1} mb={2}>
      {sortByLabel(options).map(([assetOptionKey, assetOption]) => (
        <AssetOption
          value={assetDocument?.optionValues?.[assetOptionKey]}
          key={assetOptionKey}
          assetOptionKey={assetOptionKey}
          assetOption={assetOption}
          onAssetOptionChange={onAssetOptionChange}
        />
      ))}
    </Stack>
  );
}
