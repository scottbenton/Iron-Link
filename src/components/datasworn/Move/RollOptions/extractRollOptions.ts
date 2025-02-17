import { Datasworn, IdParser } from "@datasworn/core";
import { Primary } from "@datasworn/core/dist/StringId";

import { getAsset } from "hooks/datasworn/useAsset";

import { TrackTypes } from "repositories/tracks.repository";

import { IAsset } from "services/asset.service";

import { CharacterRollOptionState } from "./common.types";

interface ActionRollGroups {
  stats: Record<string, Datasworn.RollableValue>;
  conditionMeters: Record<string, Datasworn.RollableValue>;
  custom: Record<string, Datasworn.RollableValue>;
  assetControls: Record<string, Datasworn.RollableValue>;
}

interface RollOptionGroup {
  actionRolls: Datasworn.RollableValue[];
  specialTracks: string[] | undefined;
  assetEnhancements: AssetEnhancements;
}

export function extractRollOptions(
  move: Datasworn.AnyMove,
  gameAssets: Record<string, IAsset>,
  characterRollOptionStates: Record<string, CharacterRollOptionState>,
  characterAssets: Record<string, Record<string, IAsset>>,
  tree: Record<string, Datasworn.RulesPackage>,
): {
  sharedEnhancements: AssetEnhancements;
  visibleProgressTrack: TrackTypes | undefined;
  character: Record<string, RollOptionGroup>;
} {
  const validSharedActionRolls = extractValidActionRollOptions(
    move,
    gameAssets,
    undefined,
    tree,
  );
  const sharedAssetEnhancements = getEnhancementsFromAssets(
    move._id,
    gameAssets,
    tree,
  );
  const specialTrackConditions = getSpecialTrackConditions(move);

  const characterOptions: Record<string, RollOptionGroup> = {};
  Object.entries(characterRollOptionStates).forEach(
    ([characterId, character]) => {
      const assets = characterAssets[characterId] ?? {};
      const validActionRolls = extractValidActionRollOptions(
        move,
        assets,
        character,
        tree,
      );
      const actionRollMap = {
        stats: {
          ...validSharedActionRolls.stats,
          ...validActionRolls.stats,
        },
        conditionMeters: {
          ...validSharedActionRolls.conditionMeters,
          ...validActionRolls.conditionMeters,
        },
        custom: {
          ...validSharedActionRolls.custom,
          ...validActionRolls.custom,
        },
        assetControls: {
          ...validSharedActionRolls.assetControls,
          ...validActionRolls.assetControls,
        },
      };

      const enhancements = getEnhancementsFromAssets(move._id, assets, tree);

      Object.values({ ...sharedAssetEnhancements, ...enhancements }).forEach(
        (assetEnhancement) => {
          Object.entries(assetEnhancement.actionRolls).forEach(
            ([key, value]) => {
              const typedKey = key as keyof ActionRollGroups;
              if (actionRollMap[typedKey]) {
                actionRollMap[typedKey] = {
                  ...actionRollMap[typedKey],
                  ...value,
                };
              }
            },
          );
        },
      );

      const actionRolls = Object.values(actionRollMap).flatMap((rollGroup) =>
        Object.values(rollGroup),
      );

      if (
        actionRolls.length > 0 ||
        Object.keys(enhancements).length > 0 ||
        specialTrackConditions.length > 0
      ) {
        characterOptions[characterId] = {
          actionRolls,
          assetEnhancements: enhancements,
          specialTracks: specialTrackConditions,
        };
      }
    },
  );

  return {
    visibleProgressTrack: getVisibleProgressTrack(move),
    sharedEnhancements: sharedAssetEnhancements,
    character: characterOptions,
  };
}

export type AssetEnhancements = Record<
  string,
  {
    assetName: string;
    assetInputName?: string;
    assetAbilityIndex: number;
    assetAbilityText: string;
    actionRolls: ActionRollGroups;
  }
>;

function getEnhancementsFromAssets(
  moveId: string,
  assetDocuments: Record<string, IAsset>,
  tree: Record<string, Datasworn.RulesPackage>,
): AssetEnhancements {
  const activeAssetMoveEnhancements: Record<
    string,
    {
      assetName: string;
      assetInputName?: string;
      assetAbilityIndex: number;
      assetAbilityText: string;
      enhancements: (
        | Datasworn.MoveActionRollEnhancement
        | Datasworn.MoveProgressRollEnhancement
        | Datasworn.MoveSpecialTrackEnhancement
      )[];
    }
  > = {};

  Object.values(assetDocuments).forEach((assetDocument) => {
    const asset = getAsset(assetDocument.dataswornAssetId);
    console.debug("CHECKING ASSET", asset);
    if (!asset) return;

    asset.abilities.forEach((ability, index) => {
      if (ability.enabled || assetDocument.enabledAbilities[index]) {
        ability.enhance_moves?.forEach((moveEnhancement) => {
          if (moveEnhancement.roll_type !== "no_roll") {
            if (
              moveEnhancement.enhances?.some((wildcardId) => {
                const matches = IdParser.getMatches(
                  wildcardId as Primary,
                  tree,
                );
                return matches.has(moveId);
              })
            ) {
              if (!activeAssetMoveEnhancements[ability._id]) {
                activeAssetMoveEnhancements[ability._id] = {
                  assetName: asset.name,
                  assetInputName:
                    assetDocument.optionValues?.["name"] ?? undefined,
                  assetAbilityIndex: index,
                  assetAbilityText: ability.text,
                  enhancements: [],
                };
              }
              console.debug("ADDING ENHANCEMENT", moveEnhancement);
              activeAssetMoveEnhancements[ability._id].enhancements.push(
                moveEnhancement,
              );
            }
          }
        });
      }
    });
  });

  return Object.fromEntries(
    Object.entries(activeAssetMoveEnhancements).map(([abilityId, value]) => {
      const actionRolls = extractActionRollOptionsFromEnhancement(
        value.enhancements,
      );

      return [
        abilityId,
        {
          ...value,
          actionRolls,
        },
      ];
    }),
  );
}

// function extractSpecialTrackRollOptionsFromEnhancement(
//   enhancements: (
//     | Datasworn.MoveActionRollEnhancement
//     | Datasworn.MoveProgressRollEnhancement
//     | Datasworn.MoveSpecialTrackEnhancement
//   )[]
// ): Datasworn.TriggerSpecialTrackConditionEnhancement[] {
//   const conditions: Datasworn.TriggerSpecialTrackConditionEnhancement[] = [];
//   enhancements.forEach((enhancement) => {
//     if (
//       enhancement.roll_type === "special_track" &&
//       enhancement.trigger?.conditions
//     ) {
//       conditions.push(...enhancement.trigger.conditions);
//     }
//   });
//   return conditions;
// }

function extractActionRollOptionsFromEnhancement(
  enhancements: (
    | Datasworn.MoveActionRollEnhancement
    | Datasworn.MoveProgressRollEnhancement
    | Datasworn.MoveSpecialTrackEnhancement
  )[],
): ActionRollGroups {
  const conditionMap: ActionRollGroups = {
    stats: {},
    conditionMeters: {},
    custom: {},
    assetControls: {},
  };

  enhancements.forEach((enhancement) => {
    if (enhancement.roll_type === "action_roll") {
      enhancement.trigger?.conditions.forEach((condition) => {
        condition.roll_options?.forEach((option) => {
          if (option.using === "stat") {
            conditionMap.stats[option.stat] = option;
          } else if (option.using === "condition_meter") {
            conditionMap.conditionMeters[option.condition_meter] = option;
          } else if (option.using === "custom") {
            conditionMap.custom[option.label] = option;
          } else if (option.using === "asset_control") {
            conditionMap.assetControls[option.control] = option;
          }
        });
      });
    }
  });

  return conditionMap;
}

function extractValidActionRollOptions(
  move: Datasworn.AnyMove,
  assets: Record<string, IAsset>,
  character: CharacterRollOptionState | undefined,
  tree: Record<string, Datasworn.RulesPackage>,
): ActionRollGroups {
  const conditionMap: ActionRollGroups = {
    stats: {},
    conditionMeters: {},
    custom: {},
    assetControls: {},
  };

  if (move.roll_type !== "action_roll") return conditionMap;

  const conditions = move.trigger.conditions;

  conditions.forEach((condition) => {
    condition.roll_options.forEach((option) => {
      if (option.using === "stat" && character) {
        conditionMap.stats[option.stat] = option;
      } else if (option.using === "condition_meter" && character) {
        conditionMap.conditionMeters[option.condition_meter] = option;
      } else if (option.using === "custom" && !character) {
        conditionMap.custom[option.label] = option;
      } else if (
        option.using === "asset_control" &&
        canUseAssetControlRoll(option, assets, tree)
      ) {
        conditionMap.assetControls[option.control] = option;
      }
    });
  });

  return conditionMap;
}

function canUseAssetControlRoll(
  option: Datasworn.AssetControlValueRef,
  assets: Record<string, IAsset>,
  tree: Record<string, Datasworn.RulesPackage>,
): boolean {
  return (
    option.assets?.some((assetWildcard) => {
      const matches = IdParser.getMatches(assetWildcard as Primary, tree);
      for (const [, asset] of matches) {
        if (asset.type === "asset") {
          for (const assetDocument of Object.values(assets)) {
            if (assetDocument.dataswornAssetId === asset._id) {
              const control = asset.controls?.[option.control];
              if (control) {
                return true;
              }
            }
          }
        }
      }
      return false;
    }) ?? false
  );
}

function getVisibleProgressTrack(
  move: Datasworn.AnyMove,
): TrackTypes | undefined {
  if (move.roll_type === "progress_roll") {
    switch (move.tracks.category) {
      case "Vow":
        return TrackTypes.Vow;
      case "Journey":
      case "Expedition":
        return TrackTypes.Journey;
      case "Combat":
        return TrackTypes.Fray;
      case "Scene Challenge":
        return TrackTypes.SceneChallenge;
      case "Connection":
        return TrackTypes.BondProgress;
      default:
        return undefined;
    }
  } else {
    return undefined;
  }
}

function getSpecialTrackConditions(move: Datasworn.AnyMove): string[] {
  if (move.roll_type === "special_track") {
    const specialTracks = new Set<string>();
    move.trigger.conditions.forEach((condition) => {
      condition.roll_options.forEach((option) => {
        specialTracks.add(option.using);
      });
    });

    return Array.from(specialTracks);
  }
  return [];
}
