import { Datasworn } from "@datasworn-community/core";

export function parseSpecialTrackRules(
  trees: Record<string, Datasworn.RulesPackage>,
): Record<string, Datasworn.SpecialTrackRule> {
  let specialTracks: Record<string, Datasworn.SpecialTrackRule> = {};

  Object.values(trees).forEach((tree) => {
    specialTracks = { ...specialTracks, ...(tree.rules?.special_tracks ?? {}) };
  });

  return specialTracks;
}
