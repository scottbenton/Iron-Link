import { TFunction } from "i18next";

import { Difficulty } from "repositories/tracks.repository";

export const CONNECTION_RANKS = [
  Difficulty.Troublesome,
  Difficulty.Dangerous,
  Difficulty.Formidable,
  Difficulty.Extreme,
  Difficulty.Epic,
];

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

// "Kira", "Kira and Vex", "Kira, Vex and Nova".
export function formatNames(names: string[], t: TFunction): string {
  if (names.length <= 1) return names[0] ?? "";
  return t("worlds.bonds.name-list", "{{list}} and {{last}}", {
    list: names.slice(0, -1).join(", "),
    last: names[names.length - 1],
  });
}
