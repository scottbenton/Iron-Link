import { Datasworn } from "@datasworn/core";

import { RollResult as RollResultType } from "repositories/shared.types";

export function getMoveOutcome(
  move: Datasworn.AnyMove | undefined,
  result: RollResultType,
): Datasworn.MoveOutcome | undefined {
  const outcomes =
    move && move?.roll_type !== "no_roll" ? move.outcomes : undefined;
  if (!outcomes) {
    return undefined;
  }

  switch (result) {
    case RollResultType.StrongHit:
      return outcomes.strong_hit;
    case RollResultType.WeakHit:
      return outcomes.weak_hit;
    case RollResultType.Miss:
      return outcomes.miss;
    default:
      return undefined;
  }
}
