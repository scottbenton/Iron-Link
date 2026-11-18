/**
 * Story-only dice for the examples. The app rolls through its own services;
 * this just makes the examples feel alive.
 */
import type {
  ActionRollData,
  OracleRollData,
  RollOutcome,
} from "../game/RollCard";

const d = (sides: number) => Math.floor(Math.random() * sides) + 1;

export function getOutcome(score: number, challenge: [number, number]) {
  const beaten = challenge.filter((die) => score > die).length;
  const outcomes: RollOutcome[] = ["miss", "weakHit", "strongHit"];
  return outcomes[beaten];
}

export function rollAction(
  statName: string,
  statValue: number,
  moveName?: string,
): ActionRollData {
  const actionDie = d(6);
  const actionScore = Math.min(actionDie + statValue, 10);
  const challengeDice: [number, number] = [d(10), d(10)];
  return {
    kind: "action",
    moveName,
    statName,
    statValue,
    actionDie,
    actionScore,
    challengeDice,
    outcome: getOutcome(actionScore, challengeDice),
  };
}

export function rollOracle(
  oracleName: string,
  category: string,
  rows: { min: number; max: number; text: string }[],
): OracleRollData {
  const roll = d(100);
  const row = rows.find(
    (candidate) => roll >= candidate.min && roll <= candidate.max,
  );
  return {
    kind: "oracle",
    oracleName,
    category,
    roll,
    result: row?.text ?? "No result",
    match: roll % 11 === 0 && roll !== 100,
  };
}
