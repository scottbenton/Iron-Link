import { useRollStatAndAddToLog } from "@/hooks/useRollStatAndAddToLog.ts";
import { IAsset } from "@/services/asset.service.ts";
import { useGameCharacter } from "@/stores/gameCharacters.store.ts";
import { Box } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";
import { Dice6Icon } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { DEFAULT_MOMENTUM } from "../../../data/constants.ts";
import { DebouncedConditionMeter } from "../ConditonMeter";
import { AssetControls } from "./AssetControls";
import { AssetCheckboxField } from "./fields/AssetCheckboxField";
import { AssetClockField } from "./fields/AssetClockField";
import { AssetCounterField } from "./fields/AssetCounterField";
import { AssetSelectEnhancementField } from "./fields/AssetSelectEnhancementField";
import { AssetTextField } from "./fields/AssetTextField";

export interface AssetControlProps {
  controlId: string;
  assetDocument?: IAsset;
  control: Datasworn.AssetControlField | Datasworn.AssetAbilityControlField;
  value?: boolean | string | number;
  onControlChange?: (
    controlKey: string,
    value: boolean | string | number,
  ) => void;
}
export function AssetControl(props: AssetControlProps) {
  const { controlId, control, value, onControlChange, assetDocument } = props;

  const handleControlChange = useCallback(
    (value: boolean | string | number) => {
      if (onControlChange) {
        onControlChange(controlId, value);
      }
    },
    [onControlChange, controlId],
  );

  const { t } = useTranslation();

  const momentum = useGameCharacter(
    (character) => character?.momentum ?? DEFAULT_MOMENTUM,
  );

  const rollConditionMeter = useRollStatAndAddToLog();
  const handleRoll = useCallback(() => {
    if ("rollable" in control && control.rollable) {
      rollConditionMeter({
        statId: controlId,
        statLabel: control.label,
        statModifier:
          typeof value === "number" ? (value as number) : control.max,
        momentum,
      });
    }
  }, [rollConditionMeter, value, control, controlId, momentum]);

  switch (control.field_type) {
    case "select_enhancement":
      return (
        <AssetSelectEnhancementField
          field={control}
          value={typeof value === "string" ? value : undefined}
          onChange={onControlChange ? handleControlChange : undefined}
        />
      );
    case "card_flip":
      return (
        <AssetCheckboxField
          field={control}
          value={typeof value === "boolean" ? value : undefined}
          onChange={onControlChange ? handleControlChange : undefined}
        />
      );
    case "checkbox":
      return (
        <AssetCheckboxField
          field={control}
          value={typeof value === "boolean" ? value : undefined}
          onChange={onControlChange ? handleControlChange : undefined}
        />
      );
    case "condition_meter": {
      const subControls = control.controls;
      return (
        <Box display={"flex"} alignItems="flex-start" gap={2}>
          <DebouncedConditionMeter
            label={control.label}
            defaultValue={control.value}
            min={control.min}
            max={control.max}
            value={typeof value === "number" ? (value as number) : undefined}
            disabled={!onControlChange}
            onChange={onControlChange ? handleControlChange : undefined}
            onActionClick={onControlChange ? handleRoll : undefined}
            action={
              onControlChange && control.rollable
                ? {
                    ActionIcon: Dice6Icon,
                    actionLabel: t("datasworn.roll", "Roll"),
                  }
                : undefined
            }
          />
          {subControls && (
            <Box mt={-1}>
              <AssetControls
                spacing={1}
                controls={subControls}
                assetDocument={assetDocument}
                onControlChange={onControlChange}
              />
            </Box>
          )}
        </Box>
      );
    }
    case "text": {
      return (
        <AssetTextField
          field={control}
          value={typeof value === "string" ? value : undefined}
          onChange={onControlChange ? handleControlChange : undefined}
        />
      );
    }
    case "clock": {
      return (
        <AssetClockField
          field={control}
          value={typeof value === "number" ? value : undefined}
          onChange={onControlChange ? handleControlChange : undefined}
        />
      );
    }
    case "counter": {
      return (
        <AssetCounterField
          value={typeof value === "number" ? value : undefined}
          field={control}
          onChange={onControlChange ? handleControlChange : undefined}
        />
      );
    }
  }

  return null;
}
