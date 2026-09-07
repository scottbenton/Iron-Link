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

/**
 * Whether a special track follows Starforged's legacy rule: when filled, the
 * player clears it and continues, and rolls against it thereafter use the
 * maximum progress score.
 *
 * Datasworn's SpecialTrackRule doesn't describe how a track progresses. The
 * official Starforged tracks are keyed `quests_legacy`, `bonds_legacy`, and
 * `discoveries_legacy`, while classic's `bonds` and delve's `failure_track`
 * don't follow the rule — so until datasworn grows a `progression` field
 * (see iron-link-parity/02-datasworn-extensions.md), gate on the key suffix.
 */
export function doesTrackFollowLegacyRule(specialTrackKey: string): boolean {
  return specialTrackKey.endsWith("_legacy");
}
