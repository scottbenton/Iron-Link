import { Datasworn } from "@datasworn-community/core";

import { Difficulty } from "repositories/tracks.repository";

import type { WorldEntryBondKind } from "services/worldEntryBonds.service";

// Bonds follow the game's rules packages, homebrew included, so nothing is
// configured per world:
// - Connections when a move rolls progress on "Connection" tracks (Datasworn's
//   `tracks.category`, as Starforged's Forge a Bond does); those moves are the
//   connection's finishing roll. Otherwise Ironlands bonds, when the rules
//   have a bonds track. A game with neither (Elegy) has no bonds.
// - The special track a bond marks: Datasworn keeps the reward in the move's
//   prose, so it is found by key ("bonds_legacy", then "bonds"), then by the
//   label "bonds". Without one, nothing is marked and people are reminded.
const CONNECTION_TRACK_CATEGORY = "connection";
const BOND_TRACK_KEYS: Record<WorldEntryBondKind, string[]> = {
  bond: ["bonds"],
  connection: ["bonds_legacy", "bonds"],
};

export interface WorldBondMove {
  id: string;
  name: string;
}

export interface WorldBondMechanics {
  kind: WorldEntryBondKind;
  // Key of the special track the bond marks, with its rules label, or null
  // when the rules have no bonds track.
  trackKey: string | null;
  trackLabel: string;
  // Progress moves rolled against a connection, by name.
  connectionMoves: WorldBondMove[];
}

export function getWorldBondMechanics(
  specialTrackRules: Record<string, Datasworn.SpecialTrackRule>,
  moveMap: Record<string, Datasworn.AnyMove>,
): WorldBondMechanics | null {
  const connectionMoves = Object.values(moveMap)
    .filter(
      (move) =>
        move.roll_type === "progress_roll" &&
        move.tracks.category.toLowerCase() === CONNECTION_TRACK_CATEGORY,
    )
    .map((move) => ({ id: move._id, name: move.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const kind: WorldEntryBondKind =
    connectionMoves.length > 0 ? "connection" : "bond";
  const trackKey =
    BOND_TRACK_KEYS[kind].find((key) => specialTrackRules[key]) ??
    Object.keys(specialTrackRules).find(
      (key) => specialTrackRules[key].label.toLowerCase() === "bonds",
    ) ??
    null;
  if (kind === "bond" && !trackKey) return null;
  return {
    kind,
    trackKey,
    trackLabel: trackKey ? specialTrackRules[trackKey].label : "",
    connectionMoves,
  };
}

// Classic Forge a Bond: "mark a tick on your bond progress track".
export const IRONLANDS_BOND_TICKS = 1;

// Starforged Forge a Bond: "Mark a reward on your bonds legacy track per the
// connection's rank".
export const CONNECTION_BOND_REWARD_TICKS: Record<Difficulty, number> = {
  [Difficulty.Troublesome]: 1,
  [Difficulty.Dangerous]: 2,
  [Difficulty.Formidable]: 4,
  [Difficulty.Extreme]: 8,
  [Difficulty.Epic]: 12,
};

// Mark progress on a connection, as on any progress track of its rank.
export const CONNECTION_PROGRESS_TICKS: Record<Difficulty, number> = {
  [Difficulty.Troublesome]: 12,
  [Difficulty.Dangerous]: 8,
  [Difficulty.Formidable]: 4,
  [Difficulty.Extreme]: 2,
  [Difficulty.Epic]: 1,
};
