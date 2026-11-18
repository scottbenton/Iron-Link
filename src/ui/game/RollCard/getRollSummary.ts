import {
  OracleResultPart,
  RollData,
  RollOutcome,
  isChallengeMatch,
} from "./rollTypes";

/** Every word a roll card and its summary use, with English defaults. */
export interface RollText {
  outcomes: Record<RollOutcome, string>;
  match: string;
  /** "Face Danger, Edge" */
  moveAndLabel: (moveName: string, label: string) => string;
  /** "Likely (Ask the Oracle)" */
  oracleWithCategory: (name: string, category: string) => string;
  /** "Face Danger, Edge: Strong Hit" */
  heading: (name: string, result: string) => string;
  /** "Burned 6 momentum in place of the action score." */
  momentumBurned: (momentum: number) => string;
  /** "Action die 4" */
  actionDie: (value: number) => string;
  /** ", cancelled by negative momentum" */
  actionDieCancelled: string;
  /** " plus 3" */
  plus: (value: number) => string;
  /** ", total 7" */
  total: (value: number) => string;
  /** "Challenge dice 2 and 2." */
  challengeDice: (first: number, second: number) => string;
  /** "One on the action die." */
  oneOnActionDie: string;
  /** "Progress 8 against challenge dice 3 and 9." */
  progress: (score: number, first: number, second: number) => string;
  /** "Roll 42." */
  oracleRoll: (roll: string) => string;
  /** "Cursed die 10." */
  cursedDie: (value: number) => string;
  /** "The cursed die adds: a ghost ship" */
  cursedDieAdds: (result: string) => string;
}

export const defaultRollText: RollText = {
  outcomes: { strongHit: "Strong Hit", weakHit: "Weak Hit", miss: "Miss" },
  match: "Match",
  moveAndLabel: (move, label) => `${move}, ${label}`,
  oracleWithCategory: (name, category) => `${name} (${category})`,
  heading: (name, result) => `${name}: ${result}`,
  momentumBurned: (momentum) =>
    `Burned ${momentum} momentum in place of the action score.`,
  actionDie: (value) => `Action die ${value}`,
  actionDieCancelled: ", cancelled by negative momentum",
  plus: (value) => ` plus ${value}`,
  total: (value) => `, total ${value}`,
  challengeDice: (a, b) => `Challenge dice ${a} and ${b}.`,
  oneOnActionDie: "One on the action die.",
  progress: (score, a, b) =>
    `Progress ${score} against challenge dice ${a} and ${b}.`,
  oracleRoll: (roll) => `Roll ${roll}.`,
  cursedDie: (value) => `Cursed die ${value}.`,
  cursedDieAdds: (result) => `The cursed die adds: ${result}`,
};

/** Translated words for some or all of `RollText`. */
export type RollTextOverrides = Partial<Omit<RollText, "outcomes">> & {
  outcomes?: Partial<Record<RollOutcome, string>>;
};

/** Merges translated words over the English defaults. */
export function getRollText(text?: RollTextOverrides): RollText {
  return {
    ...defaultRollText,
    ...text,
    outcomes: { ...defaultRollText.outcomes, ...text?.outcomes },
  };
}

/** An oracle result as one line of text. */
export function getOracleResultText(
  result: string | OracleResultPart[],
): string {
  return typeof result === "string"
    ? result
    : result.map((part) => part.text).join("; ");
}

/** The name a roll card shows as its title. */
export function getRollTitle(roll: RollData): string {
  switch (roll.kind) {
    case "action":
      return roll.moveName ?? roll.statName;
    case "progress":
      return roll.moveName ?? roll.trackName;
    case "oracle":
      return roll.oracleName;
  }
}

function endSentence(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/**
 * One piece of text that says everything a roll card shows: what was rolled,
 * the result, the dice and a match. Screen readers read it in place of the
 * card, and it is what a roll announces. `prefix` goes first, such as who
 * rolled it and when.
 */
export function getRollSummary(
  roll: RollData,
  options: { text?: RollTextOverrides; prefix?: string } = {},
): string {
  const t = getRollText(options.text);
  const sentences: string[] = [];
  if (options.prefix) sentences.push(endSentence(options.prefix));

  switch (roll.kind) {
    case "action": {
      const name = roll.moveName
        ? t.moveAndLabel(roll.moveName, roll.statName)
        : roll.statName;
      sentences.push(endSentence(t.heading(name, t.outcomes[roll.outcome])));
      if (roll.momentumBurned) {
        sentences.push(t.momentumBurned(roll.momentumBurned));
      } else {
        let action = t.actionDie(roll.actionDie);
        if (roll.negativeMomentumCancelled) action += t.actionDieCancelled;
        if (roll.statValue) action += t.plus(roll.statValue);
        if (roll.adds) action += t.plus(roll.adds);
        if (roll.statValue || roll.adds) {
          action += t.total(Math.min(roll.actionScore, 10));
        }
        sentences.push(endSentence(action));
      }
      sentences.push(t.challengeDice(...roll.challengeDice));
      if (isChallengeMatch(roll)) sentences.push(endSentence(t.match));
      if (roll.actionDie === 1 && !roll.momentumBurned) {
        sentences.push(t.oneOnActionDie);
      }
      break;
    }
    case "progress": {
      const name = roll.moveName
        ? t.moveAndLabel(roll.moveName, roll.trackName)
        : roll.trackName;
      sentences.push(endSentence(t.heading(name, t.outcomes[roll.outcome])));
      sentences.push(t.progress(roll.progressScore, ...roll.challengeDice));
      if (isChallengeMatch(roll)) sentences.push(endSentence(t.match));
      break;
    }
    case "oracle": {
      const name = roll.category
        ? t.oracleWithCategory(roll.oracleName, roll.category)
        : roll.oracleName;
      sentences.push(
        endSentence(t.heading(name, getOracleResultText(roll.result))),
      );
      if (roll.cursedResult) {
        sentences.push(endSentence(t.cursedDieAdds(roll.cursedResult)));
      }
      sentences.push(
        t.oracleRoll(
          Array.isArray(roll.roll) ? roll.roll.join(", ") : `${roll.roll}`,
        ),
      );
      if (roll.cursedDie) sentences.push(t.cursedDie(roll.cursedDie));
      if (roll.match) sentences.push(endSentence(t.match));
      break;
    }
  }

  return sentences.join(" ");
}
