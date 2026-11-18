import type { ProgressRank } from "../ProgressTrack";

/** Progress tracks the Tracks tab adds. */
export type ProgressTrackKind = "vow" | "journey" | "combat" | "sceneChallenge";

/** Everything the Tracks tab's Add Track menu offers. */
export type TrackKind = ProgressTrackKind | "clock";

/** The Ask the Oracle odds a clock rolls its progress on. */
export type OracleOdds =
  | "almostCertain"
  | "likely"
  | "fiftyFifty"
  | "unlikely"
  | "smallChance";

export const oracleOddsOrder: OracleOdds[] = [
  "almostCertain",
  "likely",
  "fiftyFifty",
  "unlikely",
  "smallChance",
];

/** A move that rolls against a track, such as Fulfill Your Vow. */
export interface TrackMove {
  id: string;
  name: string;
}

interface TrackBase {
  id: string;
  label: string;
  description?: string;
  /** Completed: hidden until Show Completed, and no longer marked. */
  completed?: boolean;
}

/** A vow, journey, fight or scene challenge. */
export interface ProgressTrackItem extends TrackBase {
  kind: ProgressTrackKind;
  rank: ProgressRank;
  /** Ticks, 0 to 40. */
  ticks: number;
  /** A scene challenge's tension clock: filled segments of 4. */
  tension?: number;
}

/** A campaign or tension clock. */
export interface ClockTrackItem extends TrackBase {
  kind: "clock";
  segments: number;
  value: number;
  /** The odds its Roll Progress asks the oracle at. Likely by default. */
  odds?: OracleOdds;
}

export type TrackItem = ProgressTrackItem | ClockTrackItem;

/** An action in a connection's menu, such as Share with the Party. */
export interface ConnectionMenuAction {
  key: string;
  label: string;
  /** A second line, such as why it is unavailable. */
  description?: string;
  disabled?: boolean;
  tone?: "default" | "danger";
}

/** A Starforged connection with an NPC. */
export interface ConnectionItem {
  id: string;
  /** The NPC's name. */
  label: string;
  /** Such as "Shared with the party". */
  description?: string;
  /** Links the name to the NPC's entry in Notes. */
  href?: string;
  rank: ProgressRank;
  ticks: number;
  bonded: boolean;
  /** Who shares it and removing it; shown above the rank in its menu. */
  menuActions?: ConnectionMenuAction[];
  /** False when this character can't change it (a party member's). */
  editable?: boolean;
}

/** An Ironsworn bond with a world entry. */
export interface BondItem {
  id: string;
  label: string;
  /** The entry's page in Notes. */
  href?: string;
}
