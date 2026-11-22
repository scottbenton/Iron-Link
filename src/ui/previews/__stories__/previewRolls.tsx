/**
 * Preview-only helpers: an Ironsworn character and rolls that land as roll
 * cards in the toast stack.
 */
import type { Datasworn } from "@datasworn-community/core";
import { useCallback, useState } from "react";

import { toast } from "../../components/Toast";
import { sampleCharacters } from "../../docs/fixtures/characters";
import { getMoveRollOptions } from "../../game/MoveCard";
import type { MoveRollOption } from "../../game/MoveCard";
import { RollCard, getRollSummary } from "../../game/RollCard";
import type { RollData } from "../../game/RollCard";
import { rollAction } from "../../layout/Examples/rollDice";

export const previewCharacter = sampleCharacters[0];

export function showRollToast(roll: RollData) {
  toast.custom(
    ({ dismiss }) => (
      <RollCard roll={roll} onDismiss={dismiss} elevated animateIn />
    ),
    { announcement: getRollSummary(roll) },
  );
}

const statValue = (key: string): number | undefined => {
  const { stats, meters } = previewCharacter;
  if (key in stats) return stats[key as keyof typeof stats];
  if (key in meters) return meters[key as keyof typeof meters];
  return undefined;
};

/** Rolls with the character's stats, adds reset after each roll. */
export function usePreviewRolls() {
  const [adds, setAdds] = useState(0);

  const roll = useCallback(
    (statName: string, value: number, moveName?: string) => {
      const result = rollAction(
        statName,
        value + adds,
        moveName,
        previewCharacter.meters.momentum,
      );
      showRollToast({
        ...result,
        statValue: value,
        adds: adds || undefined,
      } as RollData);
      setAdds(0);
      return result.actionDie;
    },
    [adds],
  );

  const moveRollOptions = useCallback(
    (move: Datasworn.AnyMove): MoveRollOption[] =>
      getMoveRollOptions(move).map((option) => ({
        ...option,
        value: statValue(option.id),
      })),
    [],
  );

  const [rolledOracleRows, setRolledOracleRows] = useState<
    Record<string, string>
  >({});

  /** Rolls one of a move's own tables (Pay the Price, Ask the Oracle). */
  const rollMoveOracle = useCallback(
    (move: Datasworn.AnyMove, oracle: Datasworn.EmbeddedOracleRollable) => {
      const value = Math.floor(Math.random() * 100) + 1;
      const row = oracle.rows.find(
        (candidate) =>
          candidate.roll !== null &&
          value >= candidate.roll.min &&
          value <= candidate.roll.max,
      );
      if (row) {
        setRolledOracleRows((current) => ({
          ...current,
          [oracle._id]: row._id,
        }));
      }
      showRollToast({
        kind: "oracle",
        oracleName: oracle.name,
        category: move.name,
        roll: value,
        result: row?.text ?? "No result",
        match: value % 11 === 0 && value !== 100,
      });
    },
    [],
  );

  return {
    adds,
    setAdds,
    roll,
    moveRollOptions,
    rolledOracleRows,
    rollMoveOracle,
  };
}
