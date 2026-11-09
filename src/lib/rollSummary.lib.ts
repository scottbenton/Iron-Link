import { TFunction } from "i18next";

import { RollResult, RollType } from "repositories/shared.types";

import { IGameLogRoll } from "services/gameLog.service";

export interface RollSummaryNames {
  // The move a stat or progress roll was made for.
  moveName?: string;
  // The oracle's current name, which can differ from the stored label.
  oracleName?: string;
  // Whether the roll card shows "Match" for this oracle roll.
  showOracleMatch?: boolean;
}

/**
 * Oracle results are markdown. Keeps the text of links and puts list items
 * (a shared-rolls table gives one line per column) on one line.
 */
export function getPlainRollText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .split("\n")
    .map((line) => line.replace(/^\s*[*-]\s+/, "").trim())
    .filter((line) => line.length > 0)
    .join("; ");
}

// Oracle rolls with a match setting match when the last two digits agree.
export function isOracleRollMatch(roll: number | number[]): boolean {
  if (Array.isArray(roll)) {
    return false;
  }
  return roll % 10 === Math.floor(roll / 10) % 10;
}

export function getRollResultText(result: RollResult, t: TFunction): string {
  if (result === RollResult.StrongHit) {
    return t("datasworn.strong-hit", "Strong Hit");
  }
  if (result === RollResult.Miss) {
    return t("datasworn.miss", "Miss");
  }
  return t("datasworn.weak-hit", "Weak Hit");
}

// The name a roll card shows as its title.
export function getRollTitle(
  roll: IGameLogRoll,
  names: RollSummaryNames,
): string {
  if (roll.type === RollType.OracleTable) {
    return names.oracleName ?? roll.rollLabel;
  }
  if (
    roll.type === RollType.Stat ||
    roll.type === RollType.TrackProgress ||
    roll.type === RollType.SpecialTrackProgress
  ) {
    return names.moveName ?? roll.rollLabel;
  }
  return roll.rollLabel;
}

/**
 * One piece of text that says everything a roll card shows: what was rolled,
 * the result, the dice, and a match. Screen readers read it in place of the
 * card, and it is what a roll announces.
 */
export function getRollSummary(
  roll: IGameLogRoll,
  names: RollSummaryNames,
  t: TFunction,
): string {
  const sentences: string[] = [];
  const heading = (name: string, result: string) =>
    endSentence(
      t("datasworn.roll-summary.heading", "{{name}}: {{result}}", {
        name,
        result,
      }),
    );
  const moveAndLabel = () =>
    names.moveName
      ? t("datasworn.roll-summary.move-and-label", "{{moveName}}, {{label}}", {
          moveName: names.moveName,
          label: roll.rollLabel,
        })
      : roll.rollLabel;
  const match = () =>
    sentences.push(t("datasworn.roll-summary.match", "Match."));

  switch (roll.type) {
    case RollType.Stat: {
      sentences.push(
        heading(moveAndLabel(), getRollResultText(roll.result, t)),
      );
      if (roll.momentumBurned) {
        sentences.push(
          t(
            "datasworn.roll-summary.momentum-burned",
            "Burned {{momentum}} momentum in place of the action die.",
            { momentum: roll.momentumBurned },
          ),
        );
      } else {
        let action = t(
          "datasworn.roll-summary.action-die",
          "Action die {{action}}",
          {
            action: roll.action,
          },
        );
        if (roll.matchedNegativeMomentum) {
          action += t(
            "datasworn.roll-summary.action-die-cancelled",
            ", cancelled by negative momentum",
          );
        }
        if (roll.modifier) {
          action += t("datasworn.roll-summary.plus", " plus {{value}}", {
            value: roll.modifier,
          });
        }
        if (roll.adds) {
          action += t("datasworn.roll-summary.plus", " plus {{value}}", {
            value: roll.adds,
          });
        }
        if (roll.modifier || roll.adds) {
          action += t("datasworn.roll-summary.total", ", total {{total}}", {
            total: roll.actionTotal,
          });
        }
        sentences.push(endSentence(action));
      }
      sentences.push(
        t(
          "datasworn.roll-summary.challenge-dice",
          "Challenge dice {{challenge1}} and {{challenge2}}.",
          { challenge1: roll.challenge1, challenge2: roll.challenge2 },
        ),
      );
      if (roll.challenge1 === roll.challenge2) {
        match();
      }
      if (roll.action === 1) {
        sentences.push(
          t(
            "datasworn.roll-summary.one-on-the-action-die",
            "One on the action die.",
          ),
        );
      }
      break;
    }
    case RollType.TrackProgress:
    case RollType.SpecialTrackProgress: {
      sentences.push(
        heading(moveAndLabel(), getRollResultText(roll.result, t)),
      );
      sentences.push(
        t(
          "datasworn.roll-summary.progress",
          "Progress {{progress}} against challenge dice {{challenge1}} and {{challenge2}}.",
          {
            progress: roll.trackProgress,
            challenge1: roll.challenge1,
            challenge2: roll.challenge2,
          },
        ),
      );
      if (roll.challenge1 === roll.challenge2) {
        match();
      }
      break;
    }
    case RollType.OracleTable: {
      const oracleName = names.oracleName ?? roll.rollLabel;
      const name = roll.oracleCategoryName
        ? t(
            "datasworn.roll-summary.oracle-with-category",
            "{{name}} ({{category}})",
            { name: oracleName, category: roll.oracleCategoryName },
          )
        : oracleName;
      sentences.push(heading(name, getPlainRollText(roll.result)));
      if (roll.cursedDieAdditiveResult) {
        sentences.push(
          endSentence(
            t(
              "datasworn.roll-summary.cursed-die-adds",
              "The cursed die adds: {{result}}",
              { result: getPlainRollText(roll.cursedDieAdditiveResult) },
            ),
          ),
        );
      }
      sentences.push(
        t("datasworn.roll-summary.oracle-roll", "Roll {{roll}}.", {
          roll: Array.isArray(roll.roll) ? roll.roll.join(", ") : roll.roll,
        }),
      );
      if (roll.cursedDieRoll) {
        sentences.push(
          t("datasworn.roll-summary.cursed-die", "Cursed die {{roll}}.", {
            roll: roll.cursedDieRoll,
          }),
        );
      }
      if (names.showOracleMatch) {
        match();
      }
      break;
    }
    case RollType.ClockProgression: {
      sentences.push(heading(roll.rollLabel, getPlainRollText(roll.result)));
      sentences.push(
        t("datasworn.roll-summary.oracle-roll", "Roll {{roll}}.", {
          roll: roll.roll,
        }),
      );
      if (roll.match) {
        match();
      }
      break;
    }
  }

  return sentences.join(" ");
}

function endSentence(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}
