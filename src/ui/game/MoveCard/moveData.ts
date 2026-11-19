import type { Datasworn } from "@datasworn-community/core";

import { capitalize } from "../shared";

/** One way to roll a move: a stat, a condition meter, a track or an asset. */
export interface MoveRollOption {
  /** Stable key, such as the stat id ("edge") or a track id. */
  id: string;
  /** What the button says, such as "Edge" or "Bonds". */
  label: string;
  /** The value added to the roll, shown beside the label. */
  value?: number;
  /** Shown but not pressable, such as a stat the character lacks. */
  disabled?: boolean;
}

/**
 * The stats and condition meters a move's trigger offers, in the order the
 * rules list them, without values. A starting point for stories and for
 * screens that have no character; the app usually builds richer options
 * (values, assets, tracks) itself.
 */
export function getMoveRollOptions(move: Datasworn.AnyMove): MoveRollOption[] {
  if (move.roll_type !== "action_roll") return [];
  const options: MoveRollOption[] = [];
  const seen = new Set<string>();
  const add = (id: string, label: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    options.push({ id, label });
  };
  for (const condition of move.trigger.conditions ?? []) {
    for (const option of condition.roll_options ?? []) {
      switch (option.using) {
        case "stat":
          add(option.stat, capitalize(option.stat));
          break;
        case "condition_meter":
          add(option.condition_meter, capitalize(option.condition_meter));
          break;
        case "custom":
          add(`custom:${option.label}`, option.label);
          break;
        default:
          break;
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
