import { Datasworn } from "@datasworn-community/core";
import { Stack } from "@mui/material";

import { sortByLabel } from "ui/game/AssetCard/assetData";

import { IAsset } from "services/asset.service";

import { AssetControl } from "./AssetControl";

export interface AssetControlsProps {
  controls:
    | Record<
        string,
        Datasworn.AssetControlField | Datasworn.AssetAbilityControlField
      >
    | undefined;
  assetDocument?: IAsset;
  spacing?: number;
  onControlChange?: (
    controlKey: string,
    value: boolean | string | number,
  ) => void;
}
export function AssetControls(props: AssetControlsProps) {
  const { controls, spacing = 2, assetDocument, onControlChange } = props;

  if (!controls || Object.keys(controls).length === 0) {
    return null;
  }

  return (
    <Stack direction="column" spacing={spacing} mt={spacing}>
      {sortByLabel(controls).map(([controlId, control]) => (
        <AssetControl
          key={controlId}
          value={assetDocument?.controlValues?.[controlId]}
          controlId={controlId}
          control={control}
          assetDocument={assetDocument}
          onControlChange={onControlChange}
        />
      ))}
    </Stack>
  );
}
