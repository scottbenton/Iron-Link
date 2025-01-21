import { TFunction } from "i18next";

import { TrackTypes } from "repositories/tracks.repository";

export function getTrackTypeLabel(type: TrackTypes, t: TFunction): string {
  switch (type) {
    case TrackTypes.Vow:
      return t("datasworn.track-types.vow", "Iron Vow");
    case TrackTypes.Journey:
      return t("datasworn.track-types.progress-track", "Journey / Expedition");
    case TrackTypes.Fray:
      return t("datasworn.track-types.fray", "Combat Track");
    case TrackTypes.SceneChallenge:
      return t("datasworn.track-types.scene-challenge", "Scene Challenge");
    case TrackTypes.Clock:
      return t("datasworn.track-types.clock", "Clock");
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
