/**
 * The character's settings menu and its Change Theme dialogs (migration
 * slice 12), for the sheet's owner, a player it is shared with and a viewer.
 */
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GameColorSchemeDialog } from "pages/games/overviewSheet/gameSettings/GameColorSchemeDialog";

import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useMenuState } from "stores/menuState";

import { TestWrapper } from "tests/TestWrapper";

import { CharacterEditPermissions } from "repositories/character.repository";
import { GameType } from "repositories/game.repository";
import { ColorScheme } from "repositories/shared.types";

import { ICharacter } from "services/character.service";

import { CharacterSettingsMenu } from "../CharacterSettingsMenu";
import { ColorSchemeDialog } from "../ColorSchemeDialog";

const session = vi.hoisted(() => ({ uid: "me" }));
const deleteCharacter = vi.hoisted(() => vi.fn());

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => session.uid }));
vi.mock("pages/games/characterSheet/hooks/useCharacterId", () => ({
  useCharacterId: () => "kira",
  useCharacterIdOptional: () => "kira",
}));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => "game",
  useGameIdOptional: () => "game",
}));
vi.mock("../useDeleteCharacter", () => ({
  useDeleteCharacter: () => deleteCharacter,
}));

const updateCharacterColorScheme = vi.fn(() => Promise.resolve());
const updateGameColorScheme = vi.fn(() => Promise.resolve());

const initialGame = useGameStore.getState();
const initialCharacters = useGameCharactersStore.getState();
const initialMenu = useMenuState.getState();

function setGame(gameType = GameType.Coop) {
  useGameStore.setState({
    gamePermissions: GamePermission.Player,
    game: { id: "game", name: "Ashfall", gameType, colorScheme: null },
    updateGameColorScheme,
  } as unknown as Partial<ReturnType<typeof useGameStore.getState>>);
}

function setCharacter(changes: Partial<ICharacter> = {}) {
  useGameCharactersStore.setState({
    updateCharacterColorScheme,
    characters: {
      kira: {
        id: "kira",
        uid: "me",
        gameId: "game",
        name: "Kira",
        colorScheme: null,
        editPermissions: CharacterEditPermissions.OnlyOwner,
        ...changes,
      } as unknown as ICharacter,
    },
  });
}

beforeEach(() => {
  session.uid = "me";
  setGame();
  setCharacter();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  useGameStore.setState(initialGame, true);
  useGameCharactersStore.setState(initialCharacters, true);
  useMenuState.setState(initialMenu, true);
});

function renderMenu() {
  return render(
    <MemoryRouter>
      <CharacterSettingsMenu />
    </MemoryRouter>,
    { wrapper: TestWrapper },
  );
}

async function openMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Character Settings" }));
  return { user, menu: await screen.findByRole("menu") };
}

describe("the character settings menu", () => {
  it("offers the owner every setting and opens each one's dialog", async () => {
    renderMenu();
    const { user, menu } = await openMenu();

    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual([
      "Change Name or Portrait",
      "Update Stats",
      "Change Theme",
      "Edit Access",
      "Delete Character",
    ]);

    await user.click(
      within(menu).getByRole("menuitem", { name: "Change Theme" }),
    );
    expect(useMenuState.getState().isColorSchemeDialogOpen).toBe(true);
  });

  it("opens the name, stats and access dialogs", async () => {
    renderMenu();
    let { user, menu } = await openMenu();
    await user.click(
      within(menu).getByRole("menuitem", { name: "Change Name or Portrait" }),
    );
    expect(useMenuState.getState().isCharacterDetailsDialogOpen).toBe(true);

    ({ user, menu } = await openMenu());
    await user.click(
      within(menu).getByRole("menuitem", { name: "Update Stats" }),
    );
    expect(useMenuState.getState().isCharacterStatsDialogOpen).toBe(true);

    ({ user, menu } = await openMenu());
    await user.click(
      within(menu).getByRole("menuitem", { name: "Edit Access" }),
    );
    expect(useMenuState.getState().isCharacterEditAccessDialogOpen).toBe(true);
  });

  it("has no Edit Access in a solo game", async () => {
    setGame(GameType.Solo);
    renderMenu();
    const { menu } = await openMenu();

    expect(
      within(menu).queryByRole("menuitem", { name: "Edit Access" }),
    ).not.toBeInTheDocument();
  });

  it("leaves Edit Access and Delete to the owner", async () => {
    session.uid = "bram";
    setCharacter({ editPermissions: CharacterEditPermissions.AllPlayers });
    renderMenu();
    const { menu } = await openMenu();

    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual(["Change Name or Portrait", "Update Stats", "Change Theme"]);
  });

  it("isn't there for someone who can't edit the sheet", () => {
    session.uid = "someone-else";
    renderMenu();

    expect(
      screen.queryByRole("button", { name: "Character Settings" }),
    ).not.toBeInTheDocument();
  });

  it("deletes the character after confirming", async () => {
    renderMenu();
    const { user, menu } = await openMenu();

    await user.click(
      within(menu).getByRole("menuitem", { name: "Delete Character" }),
    );
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent(
      "Are you sure you want to delete this character? This action cannot be undone.",
    );
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(deleteCharacter).toHaveBeenCalledTimes(1));
  });
});

describe("Change Theme", () => {
  it("saves the character's theme", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ColorSchemeDialog open onClose={onClose} />, {
      wrapper: TestWrapper,
    });

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /myriad/i }));
    await user.click(
      within(dialog).getByRole("button", { name: "Save Changes" }),
    );
    expect(updateCharacterColorScheme).toHaveBeenCalledWith(
      "kira",
      ColorScheme.Myriad,
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("saves the game's theme", async () => {
    const user = userEvent.setup();
    render(<GameColorSchemeDialog open onClose={vi.fn()} />, {
      wrapper: TestWrapper,
    });

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /cinder/i }));
    await user.click(
      within(dialog).getByRole("button", { name: "Save Changes" }),
    );
    expect(updateGameColorScheme).toHaveBeenCalledWith(
      "game",
      ColorScheme.Cinder,
    );
  });
});
