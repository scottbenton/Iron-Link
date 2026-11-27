import type { ProgressRank } from "ui/game/ProgressTrack";
import type {
  OracleOdds,
  ProgressTrackKind,
  TrackItem,
  TrackKind,
} from "ui/game/TracksPanel";

import {
  AskTheOracle,
  Difficulty,
  TrackStatus,
  TrackTypes,
} from "repositories/tracks.repository";

import { ITrack } from "services/tracks.service";

/**
 * Converts the app's stored tracks to and from the library Tracks panel's
 * items. Pure, so the store's values and the panel's never drift apart.
 */

const progressKindByType = {
  [TrackTypes.Vow]: "vow",
  [TrackTypes.Journey]: "journey",
  [TrackTypes.Fray]: "combat",
} as const satisfies Partial<Record<TrackTypes, ProgressTrackKind>>;

export const typeByKind: Record<
  TrackKind,
  | TrackTypes.Vow
  | TrackTypes.Journey
  | TrackTypes.Fray
  | TrackTypes.SceneChallenge
  | TrackTypes.Clock
> = {
  vow: TrackTypes.Vow,
  journey: TrackTypes.Journey,
  combat: TrackTypes.Fray,
  sceneChallenge: TrackTypes.SceneChallenge,
  clock: TrackTypes.Clock,
};

const oddsByOracle: Record<AskTheOracle, OracleOdds> = {
  [AskTheOracle.AlmostCertain]: "almostCertain",
  [AskTheOracle.Likely]: "likely",
  [AskTheOracle.FiftyFifty]: "fiftyFifty",
  [AskTheOracle.Unlikely]: "unlikely",
  [AskTheOracle.SmallChance]: "smallChance",
};

export const oracleByOdds: Record<OracleOdds, AskTheOracle> = {
  almostCertain: AskTheOracle.AlmostCertain,
  likely: AskTheOracle.Likely,
  fiftyFifty: AskTheOracle.FiftyFifty,
  unlikely: AskTheOracle.Unlikely,
  smallChance: AskTheOracle.SmallChance,
};

/**
 * The odds a clock rolls on. Likely when none was chosen, which is what its
 * picker has always shown.
 */
export function getClockOracle(oracleKey: AskTheOracle | undefined) {
  return oracleKey ?? AskTheOracle.Likely;
}

// The app's difficulties and the library's ranks share their values.
export function getRank(difficulty: Difficulty): ProgressRank {
  return difficulty as ProgressRank;
}

export function getDifficulty(rank: ProgressRank): Difficulty {
  return rank as Difficulty;
}

/** A stored track as a panel item, or undefined for a kind it doesn't show. */
export function toTrackItem(track: ITrack): TrackItem | undefined {
  const completed = track.status === TrackStatus.Completed;
  const base = {
    id: track.id,
    label: track.label,
    description: track.description,
    completed,
  };

  switch (track.type) {
    case TrackTypes.Clock:
      return {
        ...base,
        kind: "clock",
        segments: track.segments,
        value: track.value,
        odds: oddsByOracle[getClockOracle(track.oracleKey)],
      };
    case TrackTypes.SceneChallenge:
      return {
        ...base,
        kind: "sceneChallenge",
        rank: getRank(track.difficulty),
        ticks: track.value,
        tension: track.segmentsFilled,
      };
    case TrackTypes.Vow:
    case TrackTypes.Journey:
    case TrackTypes.Fray:
      return {
        ...base,
        kind: progressKindByType[track.type],
        rank: getRank(track.difficulty),
        ticks: track.value,
      };
    default:
      return undefined;
  }
}

/** The game's tracks, newest first. */
export function toTrackItems(tracks: Record<string, ITrack>): TrackItem[] {
  return Object.values(tracks)
    .sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime())
    .flatMap((track) => toTrackItem(track) ?? []);
}
