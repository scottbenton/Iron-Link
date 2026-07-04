import { Datasworn } from "@datasworn-community/core";

import { AssetSelectEnhancementField } from "./fields/AssetSelectEnhancementField";
import { AssetSelectValueField } from "./fields/AssetSelectValueField";
import { AssetTextField } from "./fields/AssetTextField";

export interface AssetOptionProps {
  assetOptionKey: string;
  value?: string;
  assetOption: Datasworn.AssetOptionField;
  onAssetOptionChange?: (assetOptionKey: string, value: string) => void;
}

export function AssetOption(props: AssetOptionProps) {
  const { assetOptionKey, value, assetOption, onAssetOptionChange } = props;

  switch (assetOption.field_type) {
    case "text":
      return (
        <AssetTextField
          field={assetOption}
          value={value}
          onChange={
            onAssetOptionChange
              ? (newValue) => onAssetOptionChange(assetOptionKey, newValue)
              : undefined
          }
        />
      );
    case "select_enhancement":
      return (
        <AssetSelectEnhancementField
          field={assetOption}
          value={value}
          onChange={
            onAssetOptionChange
              ? (newValue) => onAssetOptionChange(assetOptionKey, newValue)
              : undefined
          }
        />
      );
    case "select_value":
      return (
        <AssetSelectValueField
          field={assetOption}
          value={value}
          onChange={
            onAssetOptionChange
              ? (newValue) => onAssetOptionChange(assetOptionKey, newValue)
              : undefined
          }
        />
      );
  }

  return null;
}
