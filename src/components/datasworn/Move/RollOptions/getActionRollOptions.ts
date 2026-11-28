import { Datasworn, IdParser, StringId } from "@datasworn-community/core";
import type { TFunction } from "i18next";

import { MoveRollOption } from "ui/game/MoveCard";

import { IAsset } from "services/asset.service";

import { CharacterRollOptionState } from "./common.types";

// One roll a character can make a move with: the button it shows and the
// stat it rolls.
export interface ActionRollOption extends MoveRollOption {
  value: number;
  statId: string;
}

export interface ActionRollSources {
  character: CharacterRollOptionState;
  assets: Record<string, IAsset>;
  gameConditionMeters: Record<string, number>;
  stats: Record<string, Datasworn.StatRule>;
  conditionMeters: Record<string, Datasworn.ConditionMeterRule>;
  tree: Parameters<typeof IdParser.getMatches>[1];
}

// The buttons a character's action rolls show, in the move's order: a stat
// or meter at the character's value (a shared meter at the game's), a custom
// value, and one per asset the character or game holds for an asset
// control.
export function getActionRollOptions(
  actionRolls: Datasworn.RollableValue[],
  sources: ActionRollSources,
  t: TFunction,
): ActionRollOption[] {
  const { character, gameConditionMeters, stats, conditionMeters } = sources;
  return actionRolls.flatMap((roll, index): ActionRollOption[] => {
    if (roll.using === "stat" && stats[roll.stat]) {
      return [
        {
          id: `${index}-${roll.stat}`,
          statId: roll.stat,
          label: stats[roll.stat].label,
          value: character.stats[roll.stat] ?? 0,
        },
      ];
    }
    if (
      roll.using === "condition_meter" &&
      conditionMeters[roll.condition_meter]
    ) {
      const rule = conditionMeters[roll.condition_meter];
      return [
        {
          id: `${index}-${roll.condition_meter}`,
          statId: roll.condition_meter,
          label: rule.label,
          value:
            (rule.shared
              ? gameConditionMeters[roll.condition_meter]
              : character.conditionMeters?.[roll.condition_meter]) ??
            rule.value,
        },
      ];
    }
    if (roll.using === "custom") {
      return [
        {
          id: `${index}-${roll.label}`,
          statId: roll.label,
          label: roll.label,
          value: roll.value,
        },
      ];
    }
    if (roll.using === "asset_control") {
      return getAssetControlOptions(roll, index, sources, t);
    }
    return [];
  });
}

function getAssetControlOptions(
  roll: Datasworn.AssetControlValueRef,
  index: number,
  sources: ActionRollSources,
  t: TFunction,
): ActionRollOption[] {
  const options: Record<string, ActionRollOption> = {};
  roll.assets?.forEach((wildcard) => {
    IdParser.getMatches(wildcard as StringId.Primary, sources.tree).forEach(
      (asset) => {
        if (asset.type !== "asset") return;
        const control = asset.controls?.[roll.control];
        if (!control) return;
        Object.entries(sources.assets).forEach(([documentId, document]) => {
          if (document.dataswornAssetId !== asset._id) return;
          const value = document.controlValues?.[roll.control];
          const key = `${index}-${asset._id}-${documentId}-${roll.control}`;
          options[key] = {
            id: key,
            statId: roll.control,
            label: t(
              "datasworn.move.asset-control-roll-label",
              "{{assetName}}'s {{controlLabel}}",
              {
                assetName: document.optionValues?.["name"] ?? asset.name,
                controlLabel: control.label,
              },
            ),
            value:
              typeof value === "number"
                ? value
                : typeof control.value === "number"
                  ? control.value
                  : 0,
          };
        });
      },
    );
  });
  return Object.values(options);
}
