import { Datasworn } from "@datasworn-community/core";

import { Difficulty } from "repositories/tracks.repository";

import type { WorldEntryBondKind } from "services/worldEntryBonds.service";

// The special track a game's bonds mark, keyed by the kind of bond its rules
// use. Ironsworn's "bonds" track counts bonds; Starforged's "bonds_legacy" is
// marked when a connection becomes a bond. A game with neither (Elegy) has no
// bonds with world entries.
const BOND_TRACK_BY_KIND: Record<WorldEntryBondKind, string> = {
  bond: "bonds",
  connection: "bonds_legacy",
};

export interface WorldBondMechanics {
  kind: WorldEntryBondKind;
  // Key of the special track the bond marks, with its rules label.
  trackKey: string;
  trackLabel: string;
}

export function getWorldBondMechanics(
  specialTrackRules: Record<string, Datasworn.SpecialTrackRule>,
): WorldBondMechanics | null {
  for (const kind of ["connection", "bond"] as const) {
    const trackKey = BOND_TRACK_BY_KIND[kind];
    const rule = specialTrackRules[trackKey];
    if (rule) return { kind, trackKey, trackLabel: rule.label };
  }
  return null;
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
