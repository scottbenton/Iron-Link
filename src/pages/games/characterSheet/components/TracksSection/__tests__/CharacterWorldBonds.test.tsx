import { Datasworn } from "@datasworn-community/core";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
import { useWorldEntriesStore } from "stores/worldEntries.store";
import { useWorldEntryBondsStore } from "stores/worldEntryBonds.store";

import { CharacterEditPermissions } from "repositories/character.repository";

import { ICharacter } from "services/character.service";
import {
  IWorldEntryBond,
  WorldEntryBondsService,
} from "services/worldEntryBonds.service";

import { CharacterWorldBonds } from "../CharacterWorldBonds";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => "me" }));
vi.mock("notistack", () => ({
  enqueueSnackbar: vi.fn(),
  closeSnackbar: vi.fn(),
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

const names = ["Ada", "Bram", "Cass"];
let loaded: IWorldEntryBond[];

beforeEach(() => {
  vi.spyOn(WorldEntryBondsService, "listenToCharacterBonds").mockImplementation(
    (_, onBonds) => {
      onBonds(loaded, [], true);
      return () => {};
    },
  );
  useDataswornTreeStore.setState((state) => {
    state.specialTrackRules = {
      bonds: { label: "Bonds", optional: false },
    } as unknown as Record<string, Datasworn.SpecialTrackRule>;
    state.moves.moveMap = {};
  });
  useGameStore.setState({ gamePermissions: GamePermission.Player });
  useGameCharactersStore.setState({
    characters: {
      kira: {
        id: "kira",
        uid: "me",
        gameId: "game",
        name: "Kira",
        specialTracks: { bonds: { value: 0, completed: false } },
        editPermissions: CharacterEditPermissions.OnlyOwner,
      } as unknown as ICharacter,
    },
  });
  useWorldEntriesStore.setState((state) => {
    state.entryState.entries = Object.fromEntries(
      names.map((name) => [name, worldEntry({ id: name, name })]),
    );
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
});

function bond(entryId: string): IWorldEntryBond {
  return { entryId, characterId: "kira", worldId: category.worldId };
}

function renderBonds() {
  return render(
    <MemoryRouter>
      <CharacterWorldBonds />
    </MemoryRouter>,
  );
}

describe("Ironlands bonds on the Tracks tab", () => {
  it("starts closed with three or more, and the bar opens it", async () => {
    loaded = names.map(bond);
    const user = userEvent.setup();
    renderBonds();
    const bar = screen.getByRole("button", { name: "Bonds" });
    expect(bar).toHaveAttribute("aria-expanded", "false");
    await user.click(bar);
    expect(bar).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: "Clear bond with Ada" }),
    ).toBeInTheDocument();
  });

  it("starts open with a few", () => {
    loaded = [bond("Ada")];
    renderBonds();
    expect(screen.getByRole("button", { name: "Bonds" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Ada")).toBeVisible();
  });
});
