import { TFunction } from "i18next";

import { Difficulty } from "repositories/tracks.repository";

// Starforged's Forge a Bond, rolled against a connection's progress.
export const FORGE_A_BOND_MOVE_ID = "move:starforged/connection/forge_a_bond";

export function getRankLabel(rank: Difficulty, t: TFunction): string {
  switch (rank) {
    case Difficulty.Troublesome:
      return t(
        "datasworn.progress-tracks.difficulty-troublesome",
        "Troublesome",
      );
    case Difficulty.Dangerous:
      return t("datasworn.progress-tracks.difficulty-dangerous", "Dangerous");
    case Difficulty.Formidable:
      return t("datasworn.progress-tracks.difficulty-formidable", "Formidable");
    case Difficulty.Extreme:
      return t("datasworn.progress-tracks.difficulty-extreme", "Extreme");
    case Difficulty.Epic:
      return t("datasworn.progress-tracks.difficulty-epic", "Epic");
  }
}
