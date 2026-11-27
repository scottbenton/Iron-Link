import type { Datasworn } from "@datasworn-community/core";
import type { TFunction } from "i18next";

import { capitalize, formatSigned } from "../shared";

/**
 * What a roll option rolls. Stats, meters and assets add their value to an
 * action die (shown signed, "+3"); progress tracks and special tracks are
 * rolled as their progress score (shown plain, "6").
 */
export type MoveRollKind = "stat" | "meter" | "asset" | "track" | "special";

/** One way to roll a move: a stat, a condition meter, a track or an asset. */
export interface MoveRollOption {
  /** Stable key, such as the stat id ("edge") or a track id. */
  id: string;
  /** What the button says, such as "Edge", "Find my sister" or "Bonds". */
  label: string;
  /**
   * The value added to the roll, or a track's progress score, shown beside
   * the label.
   */
  value?: number;
  /** What it rolls, which decides how the value is written. Stat by default. */
  kind?: MoveRollKind;
  /** Shown but not pressable, such as a stat the character lacks. */
  disabled?: boolean;
}

/** The special tracks a move can roll, by Datasworn's `using` key. */
function getSpecialTrackLabels(t: TFunction): Record<string, string> {
  const bonds = t("ui.move-card.track-bonds", "Bonds");
  return {
    bonds_legacy: bonds,
    quests_legacy: t("ui.move-card.track-quests", "Quests"),
    discoveries_legacy: t("ui.move-card.track-discoveries", "Discoveries"),
    bonds_track: bonds,
  };
}

/** How a roll option's value is written: signed for an action roll. */
export function formatRollValue(option: MoveRollOption): string | undefined {
  if (option.value === undefined) return undefined;
  return option.kind === "track" || option.kind === "special"
    ? String(option.value)
    : formatSigned(option.value);
}

/**
 * The stats, condition meters and special tracks a move's trigger offers,
 * in the order the rules list them, without values. A starting point for
 * stories and for screens that have no character; the app usually builds
 * richer options (values, assets, the character's progress tracks) itself.
 * A progress roll gives none: its options are the character's tracks.
 */
export function getMoveRollOptions(
  move: Datasworn.AnyMove,
  t: TFunction,
): MoveRollOption[] {
  if (move.roll_type !== "action_roll" && move.roll_type !== "special_track") {
    return [];
  }
  const options: MoveRollOption[] = [];
  const specialTrackLabels = getSpecialTrackLabels(t);
  const seen = new Set<string>();
  const add = (id: string, label: string, kind: MoveRollKind) => {
    if (seen.has(id)) return;
    seen.add(id);
    options.push({ id, label, kind });
  };
  for (const condition of move.trigger.conditions ?? []) {
    for (const option of condition.roll_options ?? []) {
      if ("stat" in option) {
        add(option.stat, capitalize(option.stat), "stat");
      } else if ("condition_meter" in option) {
        add(
          option.condition_meter,
          capitalize(option.condition_meter),
          "meter",
        );
      } else if (option.using === "custom" && "label" in option) {
        add(`custom:${option.label}`, option.label, "stat");
      } else {
        const label = specialTrackLabels[option.using];
        if (label) add(option.using, label, "special");
      }
    }
  }
  return options;
}

/** The category from a move id, "move:starforged/adventure/face_danger". */
export function getMoveCategoryFromId(id: string): string | undefined {
  const parts = id.split("/");
  if (parts.length < 3) return undefined;
  return parts[parts.length - 2].split("_").map(capitalize).join(" ");
}

/** A move's embedded oracles, in the order the rules give them. */
export function getMoveOracles(
  move: Datasworn.AnyMove,
): Datasworn.EmbeddedOracleRollable[] {
  return Object.values(
    ("oracles" in move ? move.oracles : undefined) ?? {},
  ) as Datasworn.EmbeddedOracleRollable[];
}
