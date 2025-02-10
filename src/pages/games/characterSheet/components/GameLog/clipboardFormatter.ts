import { capitalize } from "@mui/material";

import { getMove } from "hooks/datasworn/useMove";

import { getRollResultLabel } from "data/rollResultLabel";

import { RollType } from "repositories/shared.types";
import { TrackTypes } from "repositories/tracks.repository";

import {
  IClockProgressionRoll,
  IGameLog,
  IOracleTableRoll,
  ISpecialTrackProgressRoll,
  IStatRoll,
  ITrackProgressRoll,
} from "services/gameLog.service";

export function formatRich(logId: string) {
  return `iron-link-logid:${logId}`;
}

export function convertRollToClipboard(roll: IGameLog):
  | {
      rich: string;
      plain: string;
    }
  | undefined {
  switch (roll.type) {
    case RollType.Stat: {
      const move = roll.moveId ? getMove(roll.moveId) : undefined;
      const statContents = extractStatRollContents(roll, move?.name);
      return {
        rich: formatRich(roll.id),
        plain: convertStatRollToClipboardPlain(statContents),
      };
    }
    case RollType.OracleTable: {
      const oracleContents = extractOracleRollContents(roll);
      return {
        rich: formatRich(roll.id),
        plain: convertOracleRollToClipboardPlain(oracleContents),
      };
    }
    case RollType.TrackProgress: {
      const trackProgressContents = extractTrackProgressRollContents(roll);
      return {
        rich: formatRich(roll.id),
        plain: convertTrackProgressRollToClipboardPlain(trackProgressContents),
      };
    }
    case RollType.ClockProgression: {
      const clockProgressionContents =
        extractClockProgressionRollContents(roll);

      return {
        rich: formatRich(roll.id),
        plain: convertClockProgressionRollToClipboardPlain(
          clockProgressionContents,
        ),
      };
    }
    case RollType.SpecialTrackProgress: {
      const specialTrackProgressContents =
        extractSpecialTrackProgressRollContents(roll);

      return {
        rich: formatRich(roll.id),
        plain: convertTrackProgressRollToClipboardPlain(
          specialTrackProgressContents,
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

export function convertClockProgressionRollToClipboardPlain(
  contents: ClockProgressionRollContents,
) {
  return `
${contents.title}
Roll: ${contents.roll}
${contents.result}
    `;
}

interface SpecialTrackProgressRollContents {
  title: string;
  progress: string;
  challenge: string;
  result: string;
}

export function extractSpecialTrackProgressRollContents(
  roll: ISpecialTrackProgressRoll,
): SpecialTrackProgressRollContents {
  const title = `${capitalize(roll.specialTrackKey)}: ${roll.rollLabel}`;
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
