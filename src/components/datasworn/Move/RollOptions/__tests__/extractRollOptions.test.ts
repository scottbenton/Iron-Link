/**
 * Which rolls a move offers each character: the move's own stats and
 * meters, custom values, asset controls the character's assets carry,
 * rolls an asset ability adds, and the progress or special tracks a move
 * rolls instead.
 */
import { Datasworn } from "@datasworn-community/core";
import { beforeAll, describe, expect, it } from "vitest";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

import { RULESETS, loadRules } from "tests/datasworn/rulesets";

import { TrackTypes } from "repositories/tracks.repository";

import { IAsset } from "services/asset.service";

import { CharacterRollOptionState } from "../common.types";
import { extractRollOptions } from "../extractRollOptions";

const STARSHIP = "asset:starforged/command_vehicle/starship";

function getMove(moveId: string) {
  const move = useDataswornTreeStore.getState().moves.moveMap[moveId];
  if (!move) throw new Error(`No move ${moveId}`);
  return move;
}

function asset(
  id: string,
  dataswornAssetId: string,
  enabledAbilities: Record<number, boolean> = {},
): IAsset {
  return {
    id,
    dataswornAssetId,
    order: 0,
    characterId: "kai",
    gameId: null,
    enabledAbilities,
    controlValues: {},
    optionValues: {},
  };
}

const kai: CharacterRollOptionState = {
  name: "Kai",
  stats: { edge: 1, heart: 2, iron: 3, shadow: 1, wits: 2 },
  conditionMeters: { health: 5, spirit: 4, supply: 3 },
  adds: 0,
  momentum: 2,
  specialTracks: {},
};

function extract(
  moveId: string,
  options: {
    characters?: Record<string, CharacterRollOptionState>;
    characterAssets?: Record<string, Record<string, IAsset>>;
    gameAssets?: Record<string, IAsset>;
  } = {},
) {
  return extractRollOptions(
    getMove(moveId),
    options.gameAssets ?? {},
    options.characters ?? { kai },
    options.characterAssets ?? {},
    useDataswornTreeStore.getState().activeRules,
  );
}

function describeRoll(roll: Datasworn.RollableValue) {
  switch (roll.using) {
    case "stat":
      return `stat:${roll.stat}`;
    case "condition_meter":
      return `meter:${roll.condition_meter}`;
    case "custom":
      return `custom:${roll.label}`;
    case "asset_control":
      return `control:${roll.control}`;
    default:
      return roll.using;
  }
}

describe("extractRollOptions", () => {
  beforeAll(() => {
    // Starforged alone: Sundered Isles replaces the starship and some moves.
    loadRules(RULESETS.starforged.slice(0, 1));
  });

  it("offers each character the move's stats, in the move's order", () => {
    const options = extract("move:starforged/adventure/face_danger");
    expect(options.visibleProgressTrack).toBeUndefined();
    expect(options.character.kai.actionRolls.map(describeRoll)).toEqual([
      "stat:edge",
      "stat:heart",
      "stat:iron",
      "stat:shadow",
      "stat:wits",
    ]);
    expect(options.character.kai.specialTracks).toEqual([]);
  });

  it("offers no character rolls without a character", () => {
    const options = extract("move:starforged/adventure/face_danger", {
      characters: {},
    });
    expect(options.character).toEqual({});
  });

  it("lists stats before meters, whatever order the move gives", () => {
    const options = extract("move:starforged/recover/repair");
    expect(options.character.kai.actionRolls.map(describeRoll)).toEqual([
      "stat:wits",
      "meter:supply",
      // Ship supply, read from a flagship's control where one exists.
      "control:supply",
    ]);
  });

  it("offers a move's custom values", () => {
    const options = extract(
      "move:starforged/connection/develop_your_relationship",
    );
    expect(options.character.kai.actionRolls.map(describeRoll)).toEqual([
      "custom:troublesome",
      "custom:dangerous",
      "custom:formidable",
      "custom:extreme",
      "custom:epic",
    ]);
  });

  it("offers an asset control only when the character has that asset", () => {
    const moveId = "move:starforged/suffer/withstand_damage";
    expect(extract(moveId).character.kai).toBeUndefined();

    const options = extract(moveId, {
      characterAssets: { kai: { ship: asset("ship", STARSHIP) } },
    });
    expect(options.character.kai.actionRolls.map(describeRoll)).toEqual([
      "control:integrity",
    ]);
  });

  it("offers a shared asset's control to every character", () => {
    const shared = { ...asset("ship", STARSHIP), characterId: null };
    const options = extract("move:starforged/suffer/withstand_damage", {
      gameAssets: { ship: shared },
    });
    expect(options.character.kai.actionRolls.map(describeRoll)).toEqual([
      "control:integrity",
    ]);
  });

  it("adds the rolls of an enabled asset ability, with its text", () => {
    const options = extract("move:starforged/suffer/withstand_damage", {
      characterAssets: { kai: { ship: asset("ship", STARSHIP, { 2: true }) } },
    });
    expect(options.character.kai.actionRolls.map(describeRoll)).toEqual([
      "stat:heart",
      "control:integrity",
    ]);
    const enhancements = Object.values(options.character.kai.assetEnhancements);
    expect(enhancements).toHaveLength(1);
    expect(enhancements[0]).toMatchObject({
      assetName: "Starship",
      assetAbilityIndex: 2,
    });
  });

  it.each([
    ["move:starforged/quest/fulfill_your_vow", TrackTypes.Vow],
    ["move:starforged/exploration/finish_an_expedition", TrackTypes.Journey],
    ["move:starforged/combat/take_decisive_action", TrackTypes.Fray],
    ["move:starforged/connection/forge_a_bond", TrackTypes.BondProgress],
  ])("rolls %s against %s tracks", (moveId, trackType) => {
    expect(extract(moveId).visibleProgressTrack).toBe(trackType);
  });

  it("rolls a legacy move against each of its special tracks", () => {
    const options = extract("move:starforged/legacy/continue_a_legacy");
    expect(options.character.kai.specialTracks).toEqual([
      "quests_legacy",
      "bonds_legacy",
      "discoveries_legacy",
    ]);
    expect(options.character.kai.actionRolls).toEqual([]);
  });
});
