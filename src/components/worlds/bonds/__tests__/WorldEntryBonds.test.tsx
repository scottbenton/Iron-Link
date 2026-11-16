import { Datasworn } from "@datasworn-community/core";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider } from "material-ui-confirm";
import { enqueueSnackbar } from "notistack";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDataswornTreeStore } from "stores/dataswornTree.store";
import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useWorldEntryBondsStore } from "stores/worldEntryBonds.store";

import { CharacterEditPermissions } from "repositories/character.repository";
import { Difficulty } from "repositories/tracks.repository";

import { CharacterService, ICharacter } from "services/character.service";
import {
  IWorldEntryBond,
  IWorldEntryConnection,
  WorldEntryBondsService,
} from "services/worldEntryBonds.service";

import { translate } from "../../categories/__tests__/fixtures";
import { worldEntry } from "../../entries/__tests__/fixtures";
import { WorldEntryBonds } from "../WorldEntryBonds";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => "me" }));
vi.mock("notistack", () => ({
  enqueueSnackbar: vi.fn(),
  closeSnackbar: vi.fn(),
}));
const roll = vi.fn();
let routeGameId: string | undefined;
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameIdOptional: () => routeGameId,
}));
vi.mock("pages/games/hooks/useRollCompleteProgressTrack", () => ({
  useRollCompleteProgressTrack: () => roll,
}));
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: translate }),
}));

const entry = worldEntry({ id: "captain", name: "Captain" });

function character(
  id: string,
  name: string,
  uid: string,
  bonds = 0,
): ICharacter {
  return {
    id,
    uid,
    gameId: "game",
    name,
    stats: {},
    conditionMeters: {},
    initiativeStatus: null,
    momentum: 2,
    specialTracks: {
      bonds: { value: bonds, completed: false } as never,
      bonds_legacy: { value: bonds, completed: false } as never,
    },
    debilities: {},
    adds: 0,
    profileImage: null,
    unspentExperience: 0,
    colorScheme: null,
    editPermissions: CharacterEditPermissions.OnlyOwner,
  } as unknown as ICharacter;
}

function rules(key: "bonds" | "bonds_legacy") {
  return {
    [key]: { label: "bonds", optional: false },
  } as unknown as Record<string, Datasworn.SpecialTrackRule>;
}

function bond(
  characterId: string,
  extra: Partial<IWorldEntryBond> = {},
): IWorldEntryBond {
  return {
    entryId: entry.id,
    characterId,
    worldId: entry.worldId,
    ...extra,
  };
}

function connection(
  id: string,
  extra: Partial<IWorldEntryConnection> = {},
): IWorldEntryConnection {
  return {
    id,
    entryId: entry.id,
    gameId: "game",
    characterId: "kira",
    worldId: entry.worldId,
    rank: Difficulty.Dangerous,
    ticks: 0,
    bonded: false,
    ...extra,
  };
}

const FORGE_A_BOND = "move:starforged/connection/forge_a_bond";

// Starforged's rules: the legacy track and a progress move for connections.
function useConnectionRules() {
  useDataswornTreeStore.setState((state) => {
    state.specialTrackRules = rules("bonds_legacy");
    state.moves.moveMap = {
      [FORGE_A_BOND]: {
        _id: FORGE_A_BOND,
        name: "Forge a Bond",
        roll_type: "progress_roll",
        tracks: { category: "Connection" },
      } as unknown as Datasworn.AnyMove,
    };
  });
}

let loaded: IWorldEntryBond[];
let loadedConnections: IWorldEntryConnection[];

function renderBonds(inGame = true) {
  routeGameId = inGame ? "game" : undefined;
  return render(
    <ConfirmProvider>
      <WorldEntryBonds entry={entry} />
    </ConfirmProvider>,
  );
}

beforeEach(() => {
  loaded = [];
  loadedConnections = [];
  vi.spyOn(
    WorldEntryBondsService,
    "listenToGameConnections",
  ).mockImplementation((_, onConnections) => {
    onConnections(loadedConnections, [], true);
    return () => {};
  });
  vi.spyOn(WorldEntryBondsService, "listenToEntryBonds").mockImplementation(
    (_, onBonds) => {
      onBonds(loaded, [], true);
      return () => {};
    },
  );
  vi.spyOn(CharacterService, "updateSpecialTracks").mockResolvedValue();
  useGameStore.setState({ gamePermissions: GamePermission.Player });
  useGameCharactersStore.setState({
    characters: {
      kira: character("kira", "Kira", "me", 3),
      vex: character("vex", "Vex", "someone else"),
    },
  });
});

afterEach(() => {
  // Unmount before the service spies go, or a listener restarts against the
  // real repository.
  cleanup();
  vi.restoreAllMocks();
  vi.mocked(enqueueSnackbar).mockClear();
  roll.mockClear();
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

describe("world entry bonds", () => {
  it("says where bonds live outside a game", () => {
    useDataswornTreeStore.setState({ specialTrackRules: rules("bonds") });
    renderBonds(false);
    expect(
      screen.getByText(
        "Bonds belong to characters, so they show when you open this world from a game's Notes tab.",
      ),
    ).toBeInTheDocument();
  });

  it("checks an Ironlands bond and marks the Bonds track, with Undo", async () => {
    useDataswornTreeStore.setState({ specialTrackRules: rules("bonds") });
    loaded = [bond("vex")];
    const add = vi
      .spyOn(WorldEntryBondsService, "addBond")
      .mockResolvedValue(bond("kira"));
    const user = userEvent.setup();
    renderBonds();

    const section = screen.getByRole("region", { name: "Bonds" });
    // Someone else's character shows its state but cannot be changed.
    const vex = within(section).getByRole("checkbox", { name: "Vex" });
    expect(vex).toBeChecked();
    expect(vex).toBeDisabled();

    const kira = within(section).getByRole("checkbox", { name: "Kira" });
    expect(kira).not.toBeChecked();
    await user.click(kira);

    expect(add).toHaveBeenCalledWith({
      entryId: "captain",
      characterId: "kira",
    });
    await waitFor(() =>
      expect(CharacterService.updateSpecialTracks).toHaveBeenCalled(),
    );
    expect(
      useGameCharactersStore.getState().characters.kira.specialTracks.bonds
        .value,
    ).toBe(4);
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      "Marked a tick on Kira's Bonds track",
      expect.objectContaining({ action: expect.any(Function) }),
    );
    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: "Kira" })).toBeChecked(),
    );
  });

  it("shows no bonds for rules without them", () => {
    useDataswornTreeStore.setState({ specialTrackRules: {} });
    const { container } = renderBonds();
    expect(container).toBeEmptyDOMElement();
  });

  it("marks connection progress by rank and the legacy reward on Bonded", async () => {
    useConnectionRules();
    loadedConnections = [connection("a", { ticks: 4 })];
    const update = vi
      .spyOn(WorldEntryBondsService, "updateConnection")
      .mockImplementation(async (id, changes) => ({
        ...connection(id, { ticks: 4 }),
        ...changes,
      }));
    const user = userEvent.setup();
    renderBonds();

    expect(
      screen.getByRole("heading", { name: "Connections" }),
    ).toBeInTheDocument();
    // + marks progress by the rank.
    await user.click(screen.getByRole("button", { name: "Increment Kira" }));
    expect(update).toHaveBeenCalledWith("a", { ticks: 12 });

    await user.click(screen.getByRole("button", { name: "Forge a Bond" }));
    expect(roll).toHaveBeenCalledWith(
      "bondProgress",
      "Kira and Captain",
      12,
      FORGE_A_BOND,
      "kira",
    );

    await user.click(screen.getByRole("checkbox", { name: "Bonded" }));
    await waitFor(() =>
      expect(enqueueSnackbar).toHaveBeenCalledWith(
        "Marked 2 ticks on Kira's Bonds track.",
        expect.anything(),
      ),
    );
    expect(
      useGameCharactersStore.getState().characters.kira.specialTracks
        .bonds_legacy.value,
    ).toBe(5);
  });

  it("shares a connection with the party, and reminds allies it cannot mark", async () => {
    useConnectionRules();
    loadedConnections = [connection("a")];
    const update = vi
      .spyOn(WorldEntryBondsService, "updateConnection")
      .mockImplementation(async (id, changes) => ({
        ...connection(id),
        ...changes,
      }));
    const user = userEvent.setup();
    renderBonds();

    await user.click(
      screen.getByRole("button", { name: "Connection options: Kira" }),
    );
    await user.click(
      screen.getByRole("menuitem", { name: "Share with the party" }),
    );
    expect(update).toHaveBeenCalledWith("a", { characterId: null });
    expect(
      await screen.findByRole("button", {
        name: "Connection options: The Party",
      }),
    ).toBeInTheDocument();
    // The party shares it, so no one makes another.
    expect(
      screen.queryByRole("button", { name: /Create a connection/ }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Bonded" }));
    await waitFor(() =>
      expect(enqueueSnackbar).toHaveBeenCalledWith(
        expect.stringContaining("Vex should mark"),
        expect.anything(),
      ),
    );
    expect(
      useGameCharactersStore.getState().characters.kira.specialTracks
        .bonds_legacy.value,
    ).toBe(5);
    expect(
      useGameCharactersStore.getState().characters.vex.specialTracks
        .bonds_legacy.value,
    ).toBe(0);
  });

  it("shares with the party only while no ally has their own", async () => {
    useConnectionRules();
    loadedConnections = [
      connection("a"),
      connection("b", { characterId: "vex" }),
    ];
    const user = userEvent.setup();
    renderBonds();

    // Vex's connection is read only here.
    expect(
      screen.queryByRole("button", { name: "Connection options: Vex" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Connection options: Kira" }),
    );
    expect(
      screen.getByRole("menuitem", { name: /Share with the party/ }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("creates a connection for a character with a chosen rank", async () => {
    useConnectionRules();
    const add = vi
      .spyOn(WorldEntryBondsService, "addConnection")
      .mockResolvedValue(connection("a", { rank: Difficulty.Formidable }));
    const user = userEvent.setup();
    renderBonds();

    await user.click(
      screen.getByRole("button", { name: "Create a connection" }),
    );
    // Vex isn't this player's, so only the party and Kira are offered.
    expect(
      screen.queryByRole("menuitem", { name: "For Vex" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "For Kira" }));
    await user.click(screen.getByRole("menuitem", { name: "Formidable" }));
    expect(add).toHaveBeenCalledWith({
      entryId: "captain",
      gameId: "game",
      characterId: "kira",
      rank: Difficulty.Formidable,
    });
    expect(
      await screen.findByRole("button", { name: "Forge a Bond" }),
    ).toBeInTheDocument();
  });

  it("creates a connection for the party", async () => {
    useConnectionRules();
    const add = vi
      .spyOn(WorldEntryBondsService, "addConnection")
      .mockResolvedValue(connection("a", { characterId: null }));
    const user = userEvent.setup();
    renderBonds();

    await user.click(
      screen.getByRole("button", { name: "Create a connection" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "For the party" }));
    await user.click(screen.getByRole("menuitem", { name: "Dangerous" }));
    expect(add).toHaveBeenCalledWith({
      entryId: "captain",
      gameId: "game",
      characterId: null,
      rank: Difficulty.Dangerous,
    });
  });

  it("goes straight to the rank with one character", async () => {
    useConnectionRules();
    useGameCharactersStore.setState({
      characters: { kira: character("kira", "Kira", "me") },
    });
    const add = vi
      .spyOn(WorldEntryBondsService, "addConnection")
      .mockResolvedValue(connection("a"));
    const user = userEvent.setup();
    renderBonds();

    await user.click(
      screen.getByRole("button", { name: "Create a connection" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Extreme" }));
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({
        characterId: "kira",
        rank: Difficulty.Extreme,
      }),
    );
  });
});
