import { Difficulty, TrackTypes } from "@/repositories/tracks.repository";
import { TFunction } from "i18next";

export function getTrackTypeLabel(
  type: TrackTypes,
  t: TFunction,
  difficulty?: Difficulty,
): string {
  const difficultyLabel = difficulty
    ? `${getTrackDifficultyLabel(difficulty, t)} `
    : "";

  let typeLabel: string;
  switch (type) {
    case TrackTypes.Vow:
      typeLabel = t("datasworn.track-types.vow", "Iron Vow");
      break;
    case TrackTypes.Journey:
      typeLabel = t(
        "datasworn.track-types.progress-track",
        "Journey / Expedition",
      );
      break;
    case TrackTypes.Fray:
      typeLabel = t("datasworn.track-types.fray", "Combat Track");
      break;
    case TrackTypes.SceneChallenge:
      typeLabel = t("datasworn.track-types.scene-challenge", "Scene Challenge");
      break;
    case TrackTypes.Clock:
      typeLabel = t("datasworn.track-types.clock", "Clock");
      break;
    default:
      typeLabel = "";
      break;
  }

  return `${difficultyLabel}${typeLabel}`;
}

export function getTrackDifficultyLabel(
  difficulty: Difficulty,
  t: TFunction,
): string {
  switch (difficulty) {
    case Difficulty.Troublesome:
      return t("datasworn.difficulty.troublesome", "Troublesome");
    case Difficulty.Dangerous:
      return t("datasworn.difficulty.dangerous", "Dangerous");
    case Difficulty.Formidable:
      return t("datasworn.difficulty.formidable", "Formidable");
    case Difficulty.Extreme:
      return t("datasworn.difficulty.extreme", "Extreme");
    case Difficulty.Epic:
      return t("datasworn.difficulty.epic", "Epic");
    default:
      return "";
  }
}

export const trackCompletionMoveIds: { [key in TrackTypes]?: string[] } = {
  [TrackTypes.Vow]: [
    "move:classic/quest/fulfill_your_vow",
    "move:starforged/quest/fulfill_your_vow",
  ],
  [TrackTypes.Journey]: [
    "move:classic/adventure/reach_your_destination",
    "move:starforged/exploration/finish_an_expedition",
  ],
  [TrackTypes.Fray]: [
    "move:classic/combat/end_the_fight",
    "move:starforged/combat/take_decisive_action",
  ],
  [TrackTypes.SceneChallenge]: [
    "move:starforged/scene_challenge/finish_the_scene",
  ],
};
