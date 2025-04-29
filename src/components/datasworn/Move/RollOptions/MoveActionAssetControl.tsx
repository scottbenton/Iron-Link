import { Stat } from "@/components/datasworn/Stat";
import { useRollStatAndAddToLog } from "@/hooks/useRollStatAndAddToLog";
import { IAsset } from "@/services/asset.service";
import { useDataswornTree } from "@/stores/dataswornTree.store";
import { Datasworn, IdParser } from "@datasworn/core";
import { Primary } from "@datasworn/core/dist/StringId";
import { DicesIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { CharacterRollOptionState } from "./common.types";

export interface MoveActionAssetControlProps {
  moveId: string;
  disabled?: boolean;
  rollOption: Datasworn.AssetControlValueRef;
  characterData: CharacterRollOptionState;
  characterAssets: Record<string, IAsset>;
  gameAssets: Record<string, IAsset>;
  characterId: string;
}

export function MoveActionAssetControl(props: MoveActionAssetControlProps) {
  const {
    moveId,
    rollOption,
    disabled,
    characterData,
    characterAssets,
    gameAssets,
    characterId,
  } = props;

  const { t } = useTranslation();
  const tree = useDataswornTree();

  const rollStat = useRollStatAndAddToLog();

  const assetValues = useMemo(() => {
    const actualAssetValues: Record<
      string,
      {
        label: string;
        value: number;
      }
    > = {};

    rollOption.assets?.forEach((assetWildcard) => {
      const matches = IdParser.getMatches(assetWildcard as Primary, tree);
      matches.forEach((asset) => {
        if (asset.type === "asset") {
          Object.entries({ ...characterAssets, ...gameAssets }).forEach(
            ([assetDocumentId, assetDocument]) => {
              const control = asset.controls?.[rollOption.control];
              if (control && assetDocument.dataswornAssetId === asset._id) {
                const controlValue =
                  assetDocument.controlValues?.[rollOption.control];
                const defaultControlValue = control.value;
                const controlLabel = control.label;
                const assetName =
                  assetDocument.optionValues?.["name"] ?? asset.name;
                actualAssetValues[
                  `${asset._id}-${assetDocumentId}-${rollOption.control}`
                ] = {
                  label: t(
                    "datasworn.move.asset-control-roll-label",
                    "{{assetName}}'s {{controlLabel}}",
                    { assetName, controlLabel },
                  ),
                  value:
                    typeof controlValue === "number"
                      ? controlValue
                      : ((typeof defaultControlValue === "number"
                          ? defaultControlValue
                          : 0) ?? 0),
                };
              }
            },
          );
        }
      });
    });

    return actualAssetValues;
  }, [gameAssets, characterAssets, rollOption, tree, t]);

  return (
    <>
      {Object.values(assetValues).map((assetValue, index) => (
        <Stat
          key={index}
          disabled={disabled}
          label={assetValue.label}
          value={assetValue.value}
          action={{
            actionLabel: t("datasworn.roll"),
            ActionIcon: DicesIcon,
          }}
          onActionClick={() => {
            rollStat({
              statId: rollOption.control,
              statLabel: assetValue.label,
              statModifier: assetValue.value,
              moveId,
              adds: characterData.adds ?? 0,
              momentum: characterData.momentum,
              characterId,
            });
          }}
        />
      ))}
    </>
  );
}
