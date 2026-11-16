import { Datasworn } from "@datasworn-community/core";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider } from "material-ui-confirm";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  category,
  translate,
} from "components/worlds/categories/__tests__/fixtures";
import { worldEntry } from "components/worlds/entries/__tests__/fixtures";

import { useDataswornTreeStore } from "stores/dataswornTree.store";
import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";
import { useWorldEntryBondsStore } from "stores/worldEntryBonds.store";

import { CharacterEditPermissions } from "repositories/character.repository";
import { Difficulty } from "repositories/tracks.repository";

import { ICharacter } from "services/character.service";
import {
  IWorldEntryConnection,
  WorldEntryBondsService,
} from "services/worldEntryBonds.service";

import { CharacterConnections } from "../CharacterConnections";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => "me" }));
vi.mock("notistack", () => ({
  enqueueSnackbar: vi.fn(),
  closeSnackbar: vi.fn(),
}));
vi.mock("pages/games/hooks/useRollCompleteProgressTrack", () => ({
  useRollCompleteProgressTrack: () => vi.fn(),
}));
vi.mock("pages/games/characterSheet/hooks/useCharacterId", () => ({
  useCharacterId: () => "kira",
  useCharacterIdOptional: () => "kira",
}));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => "game",
  useGameIdOptional: () => "game",
}));
vi.mock(
  "pages/games/characterSheet/components/NotesSection/hooks/useGameWorld",
  () => ({ useGameWorldId: () => category.worldId }),
);
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

const captain = worldEntry({ id: "captain", name: "Captain" });
const pilot = worldEntry({ id: "pilot", name: "Pilot" });

function character(id: string, name: string, uid: string): ICharacter {
  return {
    id,
    uid,
    gameId: "game",
    name,
    specialTracks: { bonds_legacy: { value: 0, completed: false } },
    editPermissions: CharacterEditPermissions.OnlyOwner,
  } as unknown as ICharacter;
}

function connection(
  id: string,
  extra: Partial<IWorldEntryConnection> = {},
): IWorldEntryConnection {
  return {
    id,
    entryId: captain.id,
    gameId: "game",
    characterId: "kira",
    worldId: category.worldId,
    rank: Difficulty.Dangerous,
    ticks: 0,
    bonded: false,
    ...extra,
  };
}

let loaded: IWorldEntryConnection[];

beforeEach(() => {
  loaded = [];
  vi.spyOn(
    WorldEntryBondsService,
    "listenToGameConnections",
  ).mockImplementation((_, onConnections) => {
    onConnections(loaded, [], true);
    return () => {};
  });
  useDataswornTreeStore.setState((state) => {
    state.specialTrackRules = {
      bonds_legacy: { label: "bonds", optional: false },
    } as unknown as Record<string, Datasworn.SpecialTrackRule>;
    state.moves.moveMap = {
      "move:forge_a_bond": {
        _id: "move:forge_a_bond",
        name: "Forge a Bond",
        roll_type: "progress_roll",
        tracks: { category: "Connection" },
      } as unknown as Datasworn.AnyMove,
    };
  });
  useGameStore.setState({ gamePermissions: GamePermission.Player });
  useGameCharactersStore.setState({
    characters: {
      kira: character("kira", "Kira", "me"),
      vex: character("vex", "Vex", "someone else"),
    },
  });
  useWorldCategoriesStore.setState({
    categories: { [category.id]: { ...category, supportsBonds: true } },
  });
  useWorldEntriesStore.setState((state) => {
    state.entryState.entries = { captain, pilot };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useWorldEntryBondsStore.setState({
    bonds: {},
    connections: {},
    loading: {},
    errors: {},
  });
  useDataswornTreeStore.setState((state) => {
    state.moves.moveMap = {};
  });
});

function renderConnections() {
  return render(
    <MemoryRouter>
      <ConfirmProvider>
        <CharacterConnections />
      </ConfirmProvider>
    </MemoryRouter>,
  );
}

describe("character connections on the Tracks tab", () => {
  it("starts closed and hides bonded connections until asked", async () => {
    loaded = [
      connection("a"),
      connection("b", { entryId: pilot.id, characterId: null, bonded: true }),
    ];
    const user = userEvent.setup();
    renderConnections();

    const toggle = screen.getByRole("button", { name: /Connections/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);

    expect(screen.getByText("Captain")).toBeInTheDocument();
    expect(screen.queryByText("Pilot")).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Show Bonded" }));
    expect(screen.getByText("Pilot")).toBeInTheDocument();
    expect(screen.getByText("Shared with the party")).toBeInTheDocument();
  });

  it("makes a party connection with an NPC no one is connected to", async () => {
    loaded = [connection("a")];
    const add = vi
      .spyOn(WorldEntryBondsService, "addConnection")
      .mockResolvedValue(connection("new", { entryId: pilot.id }));
    const user = userEvent.setup();
    renderConnections();

    await user.click(screen.getByRole("button", { name: /Connections/ }));
    await user.click(screen.getByRole("button", { name: "Add connection" }));
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("combobox", { name: "For" }));
    await user.click(screen.getByRole("option", { name: "The party" }));
    await user.click(within(dialog).getByRole("combobox", { name: "NPC" }));
    // Kira already has a connection with the Captain, so only the Pilot can
    // be the party's.
    expect(
      screen.queryByRole("option", { name: "Captain" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Pilot" }));
    await user.click(within(dialog).getByRole("combobox", { name: /Rank/ }));
    await user.click(screen.getByRole("option", { name: "Formidable" }));
    await user.click(
      within(dialog).getByRole("button", { name: "Create Connection" }),
    );

    expect(add).toHaveBeenCalledWith({
      entryId: pilot.id,
      gameId: "game",
      characterId: null,
      rank: Difficulty.Formidable,
    });
  });
});
