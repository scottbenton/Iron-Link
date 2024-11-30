import { Datasworn } from "@datasworn/core";
import { Stack } from "@mui/material";

import { AssetDocument } from "api-calls/assets/_asset.type";

import { AssetControl } from "./AssetControl";

export interface AssetControlsProps {
  controls:
    | Record<
        string,
        Datasworn.AssetControlField | Datasworn.AssetAbilityControlField
      >
    | undefined;
  assetDocument?: AssetDocument;
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
      {Object.keys(controls)
        .sort((c1, c2) => {
          const control1 = controls[c1];
          const control2 = controls[c2];

          return control1.label.localeCompare(control2.label);
        })
        .map((controlId) => (
          <AssetControl
            key={controlId}
            value={assetDocument?.controlValues?.[controlId]}
            controlId={controlId}
            control={controls[controlId]}
            assetDocument={assetDocument}
            onControlChange={onControlChange}
          />
        ))}
    </Stack>
  );
}
