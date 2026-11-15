import { Datasworn } from "@datasworn-community/core";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmProvider } from "material-ui-confirm";
import { enqueueSnackbar } from "notistack";
import { ReactNode } from "react";
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
  WorldEntryBondsService,
} from "services/worldEntryBonds.service";

import { translate } from "../../categories/__tests__/fixtures";
import { worldEntry } from "../../entries/__tests__/fixtures";
import { WorldBondsGameContext } from "../WorldBondsGameContext";
import { WorldEntryBonds } from "../WorldEntryBonds";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => "me" }));
vi.mock("notistack", () => ({
  enqueueSnackbar: vi.fn(),
  closeSnackbar: vi.fn(),
}));
const roll = vi.fn();
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
    kind: "bond",
    rank: null,
    ticks: 0,
    bonded: false,
    ...extra,
  };
}

let loaded: IWorldEntryBond[];

function renderBonds(inGame = true) {
  const wrap = (children: ReactNode) =>
    inGame ? (
      <WorldBondsGameContext.Provider value={{ gameId: "game" }}>
        {children}
      </WorldBondsGameContext.Provider>
    ) : (
      children
    );
  return render(
    <ConfirmProvider>
      {wrap(<WorldEntryBonds entry={entry} />)}
    </ConfirmProvider>,
  );
}

beforeEach(() => {
  loaded = [];
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
  vi.restoreAllMocks();
  vi.mocked(enqueueSnackbar).mockClear();
  roll.mockClear();
  useWorldEntryBondsStore.setState({ bonds: {}, loading: {}, errors: {} });
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
    useDataswornTreeStore.setState({
      specialTrackRules: rules("bonds_legacy"),
    });
    loaded = [
      bond("kira", {
        kind: "connection",
        rank: Difficulty.Dangerous,
        ticks: 4,
      }),
    ];
    const update = vi
      .spyOn(WorldEntryBondsService, "updateConnection")
      .mockImplementation(async (_key, changes) => ({
        ...loaded[0],
        ...changes,
      }));
    const user = userEvent.setup();
    renderBonds();

    expect(
      screen.getByRole("heading", { name: "Connections" }),
    ).toBeInTheDocument();
    // + marks progress by the rank.
    await user.click(screen.getByRole("button", { name: "Increment Kira" }));
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ characterId: "kira" }),
      { ticks: 12 },
    );

    await user.click(screen.getByRole("button", { name: "Forge a bond" }));
    expect(roll).toHaveBeenCalledWith(
      "bondProgress",
      "Kira and Captain",
      12,
      "move:starforged/connection/forge_a_bond",
      "kira",
    );

    await user.click(screen.getByRole("checkbox", { name: "Bonded" }));
    await waitFor(() =>
      expect(enqueueSnackbar).toHaveBeenCalledWith(
        "Marked 2 ticks on Kira's Bonds track",
        expect.anything(),
      ),
    );
    expect(
      useGameCharactersStore.getState().characters.kira.specialTracks
        .bonds_legacy.value,
    ).toBe(5);
  });

  it("makes a connection with a chosen rank", async () => {
    useDataswornTreeStore.setState({
      specialTrackRules: rules("bonds_legacy"),
    });
    const add = vi
      .spyOn(WorldEntryBondsService, "addConnection")
      .mockResolvedValue(
        bond("kira", { kind: "connection", rank: Difficulty.Formidable }),
      );
    const user = userEvent.setup();
    renderBonds();

    await user.click(screen.getByRole("button", { name: "Make a connection" }));
    await user.click(screen.getByRole("menuitem", { name: "Formidable" }));
    expect(add).toHaveBeenCalledWith(
      { entryId: "captain", characterId: "kira" },
      Difficulty.Formidable,
    );
    expect(
      await screen.findByRole("button", { name: "Forge a bond" }),
    ).toBeInTheDocument();
  });
});
