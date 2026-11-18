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
  /**
   * Sundered Isles' cursed die, a d10 rolled with an oracle that has a
   * cursed version. On a 10 the curse takes hold: the cursed table either
   * replaces the result (`cursed`) or adds to it (`cursedResult`).
   */
  cursedDie?: number | null;
  /** The cursed table's result added to the normal one. */
  cursedResult?: string | null;
  /**
   * The result came from the cursed table in place of the normal one, such
   * as Cursed Island Name in place of Island Name.
   */
  cursed?: boolean;
}

/**
 * A clock advance roll: Ask the Oracle with the clock's odds, and on a yes
 * the clock fills a segment.
 */
export interface ClockRollData {
  kind: "clock";
  /** The clock, such as "The Iron Syndicate seizes the mines". */
  clockName: string;
  /** The odds asked with, such as "Likely". */
  oddsName: string;
  /** The d100. */
  roll: number;
  /** The answer, such as "Yes" or "No". */
  result: string;
  /** Matching digits (11, 22, 33). */
  match?: boolean;
}

export type RollData =
  | ActionRollData
  | ProgressRollData
  | OracleRollData
  | ClockRollData;

/** A roll against the challenge dice. */
export type ChallengeRollData = ActionRollData | ProgressRollData;

/** A d100 roll: an oracle or a clock. */
export type PercentileRollData = OracleRollData | ClockRollData;

export function isChallengeRoll(roll: RollData): roll is ChallengeRollData {
  return roll.kind === "action" || roll.kind === "progress";
}

/** Both challenge dice show the same number. */
export function isChallengeMatch(roll: RollData): boolean {
  return (
    isChallengeRoll(roll) && roll.challengeDice[0] === roll.challengeDice[1]
  );
}

/** Whether a roll card should flag a match. */
export function isRollMatch(roll: RollData): boolean {
  return isChallengeRoll(roll) ? isChallengeMatch(roll) : !!roll.match;
}

/**
 * A match on the challenge dice is a critical: both dice show the same
 * number, so the score beats both or neither. The rules call these a
 * "strong hit with a match" (`high`) and a "miss with a match" (`low`).
 */
export type RollCritical = "high" | "low";

export function getRollCritical(roll: RollData): RollCritical | undefined {
  if (!isChallengeMatch(roll) || !isChallengeRoll(roll)) return undefined;
  if (roll.outcome === "strongHit") return "high";
  if (roll.outcome === "miss") return "low";
  return undefined;
}

/** The curse took hold: a 10 on the cursed die, or a cursed table. */
export function isRollCursed(roll: RollData): boolean {
  return (
    roll.kind === "oracle" &&
    (!!roll.cursed || !!roll.cursedResult || roll.cursedDie === 10)
  );
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
