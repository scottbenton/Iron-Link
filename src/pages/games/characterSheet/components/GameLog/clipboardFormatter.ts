import { Datasworn } from "@datasworn/core";

import { getMove } from "hooks/datasworn/useMove";

import { getRollResultLabel } from "data/rollResultLabel";

import { RollType } from "repositories/shared.types";
import { TrackTypes } from "repositories/tracks.repository";

import {
  IClockProgressionRoll,
  IGameLog,
  IOracleTableRoll,
  IStatRoll,
  ITrackProgressRoll,
} from "services/gameLog.service";

export function formatQuote(contents: string) {
  return `<blockquote>${contents}</blockquote>`;
}

export function formatBold(contents: string) {
  return `<b>${contents}</b>`;
}

export function formatItalic(contents: string) {
  return `<em>${contents}</em>`;
}

export function formatParagraph(contents: string) {
  return `<p>${contents}</p>`;
}

export function convertRollToClipboard(
  roll: IGameLog,
  tree: Record<string, Datasworn.RulesPackage>,
):
  | {
      rich: string;
      plain: string;
    }
  | undefined {
  switch (roll.type) {
    case RollType.Stat: {
      const move = roll.moveId ? getMove(roll.moveId, tree) : undefined;
      const statContents = extractStatRollContents(roll, move?.name);
      return {
        rich: convertStatRollToClipboardRich(statContents),
        plain: convertStatRollToClipboardPlain(statContents),
      };
    }
    case RollType.OracleTable: {
      const oracleContents = extractOracleRollContents(roll);
      return {
        rich: convertOracleRollToClipboardRich(oracleContents),
        plain: convertOracleRollToClipboardPlain(oracleContents),
      };
    }
    case RollType.TrackProgress: {
      const trackProgressContents = extractTrackProgressRollContents(roll);
      return {
        rich: convertTrackProgressRollToClipboardRich(trackProgressContents),
        plain: convertTrackProgressRollToClipboardPlain(trackProgressContents),
      };
    }
    case RollType.ClockProgression: {
      const clockProgressionContents =
        extractClockProgressionRollContents(roll);

      return {
        rich: convertClockProgressionRollToClipboardRich(
          clockProgressionContents,
        ),
        plain: convertClockProgressionRollToClipboardPlain(
          clockProgressionContents,
        ),
      };
    }
    default:
      return undefined;
  }
}

interface StatRollContents {
  title: string;
  actionContents: string;
  challengeContents: string;
  result: string;
}

export function extractStatRollContents(
  roll: IStatRoll,
  moveName: string | undefined,
): StatRollContents {
  const title = moveName ? `${moveName} (${roll.rollLabel})` : roll.rollLabel;
  let actionContents = roll.action + "";
  if (roll.modifier || roll.adds) {
    const rollTotal = roll.action + (roll.modifier ?? 0) + (roll.adds ?? 0);
    actionContents +=
      (roll.modifier ? ` + ${roll.modifier}` : "") +
      (roll.adds ? ` + ${roll.adds}` : "") +
      ` = ${rollTotal > 10 ? "10 (Max)" : rollTotal}`;
  }
  const challengeContents = `${roll.challenge1}, ${roll.challenge2}`;

  const result = getRollResultLabel(roll.result);

  return {
    title,
    actionContents,
    challengeContents,
    result,
  };
}

export function convertStatRollToClipboardRich(
  contents: StatRollContents,
): string {
  const title = formatParagraph(contents.title);
  const action = formatParagraph(
    formatItalic("Action: ") + contents.actionContents,
  );
  const challenge = formatParagraph(
    formatItalic("Challenge: ") + contents.challengeContents,
  );
  const result = formatBold(contents.result);

  return formatQuote(title + action + challenge + result);
}

export function convertStatRollToClipboardPlain(contents: StatRollContents) {
  return `
${contents.title}
Action: ${contents.actionContents}
Challenge: ${contents.challengeContents}
${contents.result}
    `;
}

interface OracleRollContents {
  title: string;
  roll: string;
  result: string;
}

export function extractOracleRollContents(
  roll: IOracleTableRoll,
): OracleRollContents {
  const title = roll.oracleCategoryName
    ? `${roll.oracleCategoryName} / ${roll.rollLabel}`
    : roll.rollLabel;
  const rollSection = roll.roll + "";
  const result = roll.result;

  return {
    title,
    roll: rollSection,
    result,
  };
}

export function convertOracleRollToClipboardRich(
  contents: OracleRollContents,
): string {
  const title = formatParagraph(contents.title);
  const roll = formatParagraph(formatItalic("Roll: ") + contents.roll);
  const result = formatBold(contents.result);

  return formatQuote(title + roll + result);
}

export function convertOracleRollToClipboardPlain(
  contents: OracleRollContents,
) {
  return `
${contents.title}
Roll: ${contents.roll}
${contents.result}
    `;
}

interface TrackProgressRollContents {
  title: string;
  progress: string;
  challenge: string;
  result: string;
}

function getTrackTypeLabel(type: TrackTypes) {
  switch (type) {
    case TrackTypes.Vow:
      return "Vow";
    case TrackTypes.BondProgress:
      return "Bond Progress";
    case TrackTypes.Clock:
      return "Clock Progress";
    case TrackTypes.Fray:
      return "Fray";
    case TrackTypes.Journey:
      return "Journey";
    default:
      return "";
  }
}

export function extractTrackProgressRollContents(
  roll: ITrackProgressRoll,
): TrackProgressRollContents {
  const title = `${getTrackTypeLabel(roll.trackType)}: ${roll.rollLabel}`;
  const progress = roll.trackProgress + "";
  const challenge = `${roll.challenge1}, ${roll.challenge2}`;
  const result = getRollResultLabel(roll.result).toLocaleUpperCase();

  return {
    title,
    progress,
    challenge,
    result,
  };
}

export function convertTrackProgressRollToClipboardRich(
  contents: TrackProgressRollContents,
): string {
  const title = formatParagraph(contents.title);
  const progress = formatParagraph(
    formatItalic("Progress: ") + contents.progress,
  );
  const challenge = formatParagraph(
    formatItalic("Challenge: ") + contents.challenge,
  );
  const result = formatBold(contents.result);

  return formatQuote(title + progress + challenge + result);
}

export function convertTrackProgressRollToClipboardPlain(
  contents: TrackProgressRollContents,
) {
  return `
${contents.title}
Progress: ${contents.progress}
Challenge: ${contents.challenge}
${contents.result}
    `;
}

interface ClockProgressionRollContents {
  title: string;
  roll: string;
  result: string;
}

export function extractClockProgressionRollContents(
  roll: IClockProgressionRoll,
): ClockProgressionRollContents {
  const title = roll.rollLabel;
  const rollResult = roll.roll + "";
  const result = roll.result.toLocaleUpperCase();

  return {
    title,
    roll: rollResult,
    result,
  };
}

export function convertClockProgressionRollToClipboardRich(
  contents: ClockProgressionRollContents,
): string {
  const title = formatParagraph(contents.title);
  const roll = formatParagraph(formatItalic("Roll: ") + contents.roll);
  const result = formatBold(contents.result);

  return formatQuote(title + roll + result);
}

export function convertClockProgressionRollToClipboardPlain(
  contents: ClockProgressionRollContents,
) {
  return `
${contents.title}
Roll: ${contents.roll}
${contents.result}
    `;
}
