import type { TFunction } from "i18next";

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
  /** "Cursed", for a result from the cursed table. */
  cursed: string;
  /** "Clock" */
  clock: string;
}

export function getDefaultRollText(t: TFunction): RollText {
  return {
    outcomes: {
      strongHit: t("ui.roll.strong-hit", "Strong Hit"),
      weakHit: t("ui.roll.weak-hit", "Weak Hit"),
      miss: t("ui.roll.miss", "Miss"),
    },
    match: t("ui.roll.match", "Match"),
    moveAndLabel: (move, label) =>
      t("ui.roll.move-and-label", "{{move}}, {{label}}", { move, label }),
    oracleWithCategory: (name, category) =>
      t("ui.roll.oracle-with-category", "{{name}} ({{category}})", {
        name,
        category,
      }),
    heading: (name, result) =>
      t("ui.roll.heading", "{{name}}: {{result}}", { name, result }),
    momentumBurned: (momentum) =>
      t(
        "ui.roll.momentum-burned",
        "Burned {{momentum}} momentum in place of the action score.",
        { momentum },
      ),
    actionDie: (value) =>
      t("ui.roll.action-die", "Action die {{value}}", { value }),
    actionDieCancelled: t(
      "ui.roll.action-die-cancelled",
      ", cancelled by negative momentum",
    ),
    plus: (value) => t("ui.roll.plus", " plus {{value}}", { value }),
    total: (value) => t("ui.roll.total", ", total {{value}}", { value }),
    challengeDice: (first, second) =>
      t("ui.roll.challenge-dice", "Challenge dice {{first}} and {{second}}.", {
        first,
        second,
      }),
    oneOnActionDie: t("ui.roll.one-on-action-die", "One on the action die."),
    progress: (score, first, second) =>
      t(
        "ui.roll.progress",
        "Progress {{score}} against challenge dice {{first}} and {{second}}.",
        { score, first, second },
      ),
    oracleRoll: (roll) => t("ui.roll.oracle-roll", "Roll {{roll}}.", { roll }),
    cursedDie: (value) =>
      t("ui.roll.cursed-die", "Cursed die {{value}}.", { value }),
    cursedDieAdds: (result) =>
      t("ui.roll.cursed-die-adds", "The cursed die adds: {{result}}", {
        result,
      }),
    cursed: t("ui.roll.cursed", "Cursed"),
    clock: t("ui.roll.clock", "Clock"),
  };
}

/** Translated words for some or all of `RollText`. */
export type RollTextOverrides = Partial<Omit<RollText, "outcomes">> & {
  outcomes?: Partial<Record<RollOutcome, string>>;
};

/** Merges overrides over the translated defaults. */
export function getRollText(t: TFunction, text?: RollTextOverrides): RollText {
  const defaults = getDefaultRollText(t);
  return {
    ...defaults,
    ...text,
    outcomes: { ...defaults.outcomes, ...text?.outcomes },
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
    case "clock":
      return roll.clockName;
  }
}

/**
 * What a roll card shows beside its title: the stat, the track, the
 * oracle's category or the clock's odds.
 */
export function getRollContext(roll: RollData): string | undefined {
  switch (roll.kind) {
    case "action":
      return roll.moveName ? roll.statName : undefined;
    case "progress":
      return roll.moveName ? roll.trackName : undefined;
    case "oracle":
      return roll.category;
    case "clock":
      return roll.oddsName;
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
  t: TFunction,
  options: { text?: RollTextOverrides; prefix?: string } = {},
): string {
  const words = getRollText(t, options.text);
  const sentences: string[] = [];
  if (options.prefix) sentences.push(endSentence(options.prefix));

  switch (roll.kind) {
    case "action": {
      const name = roll.moveName
        ? words.moveAndLabel(roll.moveName, roll.statName)
        : roll.statName;
      sentences.push(
        endSentence(words.heading(name, words.outcomes[roll.outcome])),
      );
      if (roll.momentumBurned) {
        sentences.push(words.momentumBurned(roll.momentumBurned));
      } else {
        let action = words.actionDie(roll.actionDie);
        if (roll.negativeMomentumCancelled) {
          action += words.actionDieCancelled;
          if (roll.statValue || roll.adds) action += ",";
        }
        if (roll.statValue) action += words.plus(roll.statValue);
        if (roll.adds) action += words.plus(roll.adds);
        if (roll.statValue || roll.adds) {
          action += words.total(Math.min(roll.actionScore, 10));
        }
        sentences.push(endSentence(action));
      }
      sentences.push(words.challengeDice(...roll.challengeDice));
      if (isChallengeMatch(roll)) sentences.push(endSentence(words.match));
      if (roll.actionDie === 1 && !roll.momentumBurned) {
        sentences.push(words.oneOnActionDie);
      }
      break;
    }
    case "progress": {
      const name = roll.moveName
        ? words.moveAndLabel(roll.moveName, roll.trackName)
        : roll.trackName;
      sentences.push(
        endSentence(words.heading(name, words.outcomes[roll.outcome])),
      );
      sentences.push(words.progress(roll.progressScore, ...roll.challengeDice));
      if (isChallengeMatch(roll)) sentences.push(endSentence(words.match));
      break;
    }
    case "oracle": {
      const name = roll.category
        ? words.oracleWithCategory(roll.oracleName, roll.category)
        : roll.oracleName;
      sentences.push(
        endSentence(words.heading(name, getOracleResultText(roll.result))),
      );
      if (roll.cursed) sentences.push(endSentence(words.cursed));
      if (roll.cursedResult) {
        sentences.push(endSentence(words.cursedDieAdds(roll.cursedResult)));
      }
      sentences.push(
        words.oracleRoll(
          Array.isArray(roll.roll) ? roll.roll.join(", ") : `${roll.roll}`,
        ),
      );
      if (roll.cursedDie) sentences.push(words.cursedDie(roll.cursedDie));
      if (roll.match) sentences.push(endSentence(words.match));
      break;
    }
    case "clock": {
      const name = words.oracleWithCategory(
        words.moveAndLabel(words.clock, roll.clockName),
        roll.oddsName,
      );
      sentences.push(endSentence(words.heading(name, roll.result)));
      sentences.push(words.oracleRoll(`${roll.roll}`));
      if (roll.match) sentences.push(endSentence(words.match));
      break;
    }
  }

  return sentences.join(" ");
}
