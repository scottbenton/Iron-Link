/**
 * Roll data the cards draw. These are the library's own shapes; the app maps
 * its game log rolls onto them.
 */

export type RollOutcome = "strongHit" | "weakHit" | "miss";

/** An action roll: a stat or meter against two challenge dice. */
export interface ActionRollData {
  kind: "action";
  /** The move, such as "Face Danger". Optional for a plain stat roll. */
  moveName?: string;
  /** The stat or meter rolled, such as "Edge" or "Health". */
  statName: string;
  /** The stat's value, added to the action die. */
  statValue: number;
  /** Adds from the character sheet or the move. */
  adds?: number;
  /** The d6. */
  actionDie: number;
  /** Action die plus stat plus adds, before the cap of 10. */
  actionScore: number;
  /** The two d10s. */
  challengeDice: [number, number];
  outcome: RollOutcome;
  /** Momentum burned in place of the action score, if any. */
  momentumBurned?: number | null;
  /** Negative momentum matched the action die, so it counted as zero. */
  negativeMomentumCancelled?: boolean;
}

/** A progress roll: a track's progress score against two challenge dice. */
export interface ProgressRollData {
  kind: "progress";
  /** The move, such as "Fulfill Your Vow". */
  moveName?: string;
  /** The track, such as "Recover the Hollow Crown". */
  trackName: string;
  /** Full boxes, 0 to 10. */
  progressScore: number;
  challengeDice: [number, number];
  outcome: RollOutcome;
}

/** One column of a shared oracle roll, such as Action in Action + Theme. */
export interface OracleResultPart {
  label: string;
  text: string;
}

/** An oracle roll: Ask the Oracle, or one or more oracle tables. */
export interface OracleRollData {
  kind: "oracle";
  /** The oracle, such as "Action + Theme" or "Likely". */
  oracleName: string;
  /** Where it comes from, such as "Core Oracles" or "Ask the Oracle". */
  category?: string;
  /** The d100 roll, or one per table for a shared roll. */
  roll: number | number[];
  /** Plain text, or one part per table. */
  result: string | OracleResultPart[];
  /** The oracle rolled a match (11, 22, 33). */
  match?: boolean;
  /** Sundered Isles' cursed die, and what it adds. */
  cursedDie?: number | null;
  cursedResult?: string | null;
}

export type RollData = ActionRollData | ProgressRollData | OracleRollData;

/** Both challenge dice show the same number. */
export function isChallengeMatch(roll: RollData): boolean {
  return (
    roll.kind !== "oracle" && roll.challengeDice[0] === roll.challengeDice[1]
  );
}

/** Whether a roll card should flag a match. */
export function isRollMatch(roll: RollData): boolean {
  return roll.kind === "oracle" ? !!roll.match : isChallengeMatch(roll);
}

/** The score the challenge dice are compared against. */
export function getComparedScore(roll: RollData): number | undefined {
  if (roll.kind === "progress") return roll.progressScore;
  if (roll.kind === "action") {
    if (roll.momentumBurned) return roll.momentumBurned;
    return Math.min(roll.actionScore, 10);
  }
  return undefined;
}

/**
 * Scores an action or progress roll: beating (not tying) both challenge dice
 * is a strong hit, one a weak hit, neither a miss.
 */
export function getRollOutcome(
  score: number,
  challengeDice: [number, number],
): RollOutcome {
  const beaten = challengeDice.filter((die) => score > die).length;
  return beaten === 2 ? "strongHit" : beaten === 1 ? "weakHit" : "miss";
}
