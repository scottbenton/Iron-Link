import { Datasworn } from "@datasworn-community/core";

import { getVisibleProgressTrack } from "components/datasworn/Move/RollOptions/extractRollOptions";

import { TrackTypes } from "repositories/tracks.repository";

export interface ReferenceActionRollOption {
  key: string;
  statId: string;
  label: string;
  defaultValue: number;
  // A custom roll option carries its own value, which can't be changed.
  fixedValue?: number;
}

export type ReferenceRollOptions =
  | { kind: "action"; options: ReferenceActionRollOption[] }
  | { kind: "progress"; trackType: TrackTypes | undefined }
  | { kind: "special_track"; tracks: { key: string; label: string }[] }
  | { kind: "none" };

export const DEFAULT_STAT_VALUE = 2;

// What a move can be rolled with when there is no character: the stats,
// meters and fixed values its trigger names, a progress score, or a legacy
// track's score.
export function getReferenceRollOptions(
  move: Datasworn.AnyMove,
  statRules: Record<string, Datasworn.StatRule>,
  conditionMeterRules: Record<string, Datasworn.ConditionMeterRule>,
  specialTrackRules: Record<string, Datasworn.SpecialTrackRule>,
): ReferenceRollOptions {
  if (move.roll_type === "action_roll") {
    const options: ReferenceActionRollOption[] = [];
    const seen = new Set<string>();
    const add = (option: ReferenceActionRollOption) => {
      if (seen.has(option.key)) return;
      seen.add(option.key);
      options.push(option);
    };

    move.trigger.conditions.forEach((condition) => {
      condition.roll_options.forEach((rollOption) => {
        if (rollOption.using === "stat") {
          add({
            key: `stat:${rollOption.stat}`,
            statId: rollOption.stat,
            label: statRules[rollOption.stat]?.label ?? rollOption.stat,
            defaultValue: DEFAULT_STAT_VALUE,
          });
        } else if (rollOption.using === "condition_meter") {
          const rule = conditionMeterRules[rollOption.condition_meter];
          add({
            key: `condition_meter:${rollOption.condition_meter}`,
            statId: rollOption.condition_meter,
            label: rule?.label ?? rollOption.condition_meter,
            defaultValue: rule?.value ?? DEFAULT_STAT_VALUE,
          });
        } else if (rollOption.using === "custom") {
          add({
            key: `custom:${rollOption.label}:${rollOption.value}`,
            statId: rollOption.label,
            label: rollOption.label,
            defaultValue: rollOption.value,
            fixedValue: rollOption.value,
          });
        } else if (rollOption.using === "asset_control") {
          add({
            key: `asset_control:${rollOption.control}`,
            statId: rollOption.control,
            label: rollOption.control.replace(/_/g, " "),
            defaultValue: DEFAULT_STAT_VALUE,
          });
        }
      });
    });

    return options.length > 0 ? { kind: "action", options } : { kind: "none" };
  }

  if (move.roll_type === "progress_roll") {
    return { kind: "progress", trackType: getVisibleProgressTrack(move) };
  }

  if (move.roll_type === "special_track") {
    const keys = new Set<string>();
    move.trigger.conditions.forEach((condition) => {
      condition.roll_options.forEach((rollOption) => {
        keys.add(rollOption.using);
      });
    });
    const tracks = Array.from(keys).map((key) => ({
      key,
      label: specialTrackRules[key]?.label ?? key.replace(/_/g, " "),
    }));
    return tracks.length > 0
      ? { kind: "special_track", tracks }
      : { kind: "none" };
  }

  return { kind: "none" };
}
