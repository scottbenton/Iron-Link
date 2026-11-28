/**
 * The rolls a move offers in a game: a button per stat, meter or asset
 * control for each character the reader may roll for, Adds beside them, and
 * a roll per active progress or special track for moves that roll progress.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MockedFunction,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";

import { useAssetsStore } from "stores/assets.store";
import { useAuthStore } from "stores/auth.store";
import { useDataswornTreeStore } from "stores/dataswornTree.store";
import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useTracksStore } from "stores/tracks.store";

import { TestWrapper } from "tests/TestWrapper";
import { RULESETS, loadRules } from "tests/datasworn/rulesets";

import { CharacterEditPermissions } from "repositories/character.repository";
import {
  Difficulty,
  TrackStatus,
  TrackTypes,
} from "repositories/tracks.repository";

import { IAsset } from "services/asset.service";
import { ICharacter } from "services/character.service";
import { ITrack } from "services/tracks.service";

import { MoveRollOptions } from "../MoveRollOptions";

vi.mock("pages/games/characterSheet/hooks/useCharacterId", () => ({
  useCharacterIdOptional: vi.fn(),
  useCharacterId: vi.fn(),
}));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameIdOptional: () => "game",
  useGameId: () => "game",
}));

const rollStat = vi.fn();
const rollProgress = vi.fn();
const rollSpecial = vi.fn();
vi.mock("pages/games/hooks/useRollStatAndAddToLog", () => ({
  useRollStatAndAddToLog: () => rollStat,
}));
vi.mock("pages/games/hooks/useRollCompleteProgressTrack", () => ({
  useRollCompleteProgressTrack: () => rollProgress,
}));
vi.mock("pages/games/hooks/useRollCompleteSpecialTrack", () => ({
  useRollCompleteSpecialTrack: () => rollSpecial,
}));

const mockCharacterId = useCharacterIdOptional as MockedFunction<
  typeof useCharacterIdOptional
>;

const STARSHIP = "asset:starforged/command_vehicle/starship";
const updateCharacterAdds = vi.fn(() => Promise.resolve());

function character(
  id: string,
  uid: string,
  changes: Partial<ICharacter> = {},
): ICharacter {
  return {
    id,
    uid,
    gameId: "game",
    name: id === "kai" ? "Kai" : "Ash",
    stats: { edge: 1, heart: 2, iron: 3, shadow: 1, wits: 2 },
    conditionMeters: { health: 5, spirit: 4, supply: 3 },
    momentum: 2,
    adds: 0,
    specialTracks: { quests_legacy: { value: 12, completed: false } },
    editPermissions: CharacterEditPermissions.OnlyOwner,
    ...changes,
  } as unknown as ICharacter;
}

function track(
  id: string,
  label: string,
  created: number,
  type = TrackTypes.Vow,
): ITrack {
  return {
    id,
    label,
    type,
    value: created * 4,
    status: TrackStatus.Active,
    difficulty: Difficulty.Dangerous,
    createdDate: new Date(2026, 0, created),
  } as unknown as ITrack;
}

function getMove(moveId: string) {
  const move = useDataswornTreeStore.getState().moves.moveMap[moveId];
  if (!move) throw new Error(`No move ${moveId}`);
  return move;
}

function renderMove(moveId: string) {
  return render(<MoveRollOptions move={getMove(moveId)} />, {
    wrapper: TestWrapper,
  });
}

beforeAll(() => {
  // Starforged alone: Sundered Isles replaces the starship and some moves.
  loadRules(RULESETS.starforged.slice(0, 1));
});

beforeEach(() => {
  vi.clearAllMocks();
  mockCharacterId.mockReturnValue(undefined);
  useAuthStore.setState({ uid: "me" });
  useGameStore.setState({
    gamePermissions: GamePermission.Player,
    game: undefined,
  });
  useGameCharactersStore.setState({
    characters: { kai: character("kai", "me"), ash: character("ash", "other") },
    updateCharacterAdds,
  });
  useAssetsStore.setState({ assets: {} });
  useTracksStore.setState({ tracks: {} });
});

describe("MoveRollOptions", () => {
  it("offers your own characters' stats off a sheet, under their names", async () => {
    const user = userEvent.setup();
    renderMove("move:starforged/adventure/face_danger");

    expect(screen.getByText("Kai")).toBeInTheDocument();
    expect(screen.queryByText("Ash")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /edge/i })).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /edge/i }));
    expect(rollStat).toHaveBeenCalledWith(
      expect.objectContaining({
        statId: "edge",
        statModifier: 1,
        moveId: "move:starforged/adventure/face_danger",
        adds: 0,
        momentum: 2,
        characterId: "kai",
      }),
    );
  });

  it("offers the sheet's character, without a name, when you can edit it", () => {
    mockCharacterId.mockReturnValue("ash");
    useGameCharactersStore.setState((state) => {
      state.characters.ash = character("ash", "other", {
        editPermissions: CharacterEditPermissions.AllPlayers,
      });
    });
    renderMove("move:starforged/adventure/face_danger");

    expect(screen.queryByText("Ash")).not.toBeInTheDocument();
    expect(screen.queryByText("Kai")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /edge/i })).toHaveLength(1);
  });

  it("offers nothing on a sheet you can't edit", () => {
    mockCharacterId.mockReturnValue("ash");
    renderMove("move:starforged/adventure/face_danger");

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("changes the character's adds", async () => {
    const user = userEvent.setup();
    renderMove("move:starforged/adventure/face_danger");

    await user.click(screen.getByRole("button", { name: /add 1 to adds/i }));
    expect(updateCharacterAdds).toHaveBeenCalledWith("kai", 1);
  });

  it("rolls a shared meter with the game's value", async () => {
    const user = userEvent.setup();
    useGameStore.setState({
      game: { conditionMeters: { supply: 5 } } as never,
    });
    renderMove("move:starforged/recover/repair");

    const [characterSupply] = screen.getAllByRole("button", {
      name: /supply/i,
    });
    await user.click(characterSupply);
    expect(rollStat).toHaveBeenCalledWith(
      expect.objectContaining({ statId: "supply", statModifier: 5 }),
    );
  });

  it("rolls an asset's control with its default value", async () => {
    const user = userEvent.setup();
    const ship: IAsset = {
      id: "ship",
      dataswornAssetId: STARSHIP,
      order: 0,
      characterId: "kai",
      gameId: null,
      enabledAbilities: {},
      controlValues: {},
      optionValues: {},
    };
    useAssetsStore.setState({ assets: { ship } });
    renderMove("move:starforged/suffer/withstand_damage");

    await user.click(screen.getByRole("button", { name: /integrity/i }));
    expect(rollStat).toHaveBeenCalledWith(
      expect.objectContaining({
        statId: "integrity",
        statModifier: 5,
        characterId: "kai",
      }),
    );
  });

  it("rolls each active track of the move's type, newest first", async () => {
    const user = userEvent.setup();
    useTracksStore.setState({
      tracks: {
        old: track("old", "Avenge my kin", 1),
        newer: track("newer", "Find the ship", 2),
        done: {
          ...track("done", "Done already", 3),
          status: TrackStatus.Completed,
        },
        journey: track("journey", "To the Forge", 4, TrackTypes.Journey),
      },
    });
    renderMove("move:starforged/quest/fulfill_your_vow");

    const rolls = screen.getAllByRole("button", {
      name: /roll fulfill your vow/i,
    });
    expect(rolls).toHaveLength(2);
    await user.click(rolls[0]);
    expect(rollProgress).toHaveBeenLastCalledWith(
      TrackTypes.Vow,
      "Find the ship",
      8,
      "move:starforged/quest/fulfill_your_vow",
    );
    await user.click(rolls[1]);
    expect(rollProgress).toHaveBeenLastCalledWith(
      TrackTypes.Vow,
      "Avenge my kin",
      4,
      "move:starforged/quest/fulfill_your_vow",
    );
  });

  it("rolls a legacy move against each special track", async () => {
    const user = userEvent.setup();
    renderMove("move:starforged/legacy/continue_a_legacy");

    const rolls = screen.getAllByRole("button", {
      name: /roll continue a legacy/i,
    });
    expect(rolls).toHaveLength(3);
    await user.click(rolls[0]);
    expect(rollSpecial).toHaveBeenCalledWith(
      "quests_legacy",
      "Quests",
      12,
      "move:starforged/legacy/continue_a_legacy",
    );
  });
});
