/**
 * The character's settings menu and the game page's Theme dialog,
 * for the sheet's owner, a player it is shared with and a viewer.
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

import { GameThemeDialog } from "pages/games/gamePageLayout/GameSettings/GameThemeDialog";

import { useAppThemeStore } from "stores/appTheme.store";
import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useMenuState } from "stores/menuState";

import { TestWrapper } from "tests/TestWrapper";

import { CharacterEditPermissions } from "repositories/character.repository";
import { GameType } from "repositories/game.repository";
import { ColorScheme } from "repositories/shared.types";

import { ICharacter } from "services/character.service";

import { CharacterSettingsMenu } from "../CharacterSettingsMenu";

const session = vi.hoisted(() => ({ uid: "me" }));
const deleteCharacter = vi.hoisted(() => vi.fn());
const setColorScheme = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => session.uid }));
vi.mock("services/user.service", () => ({ UserService: { setColorScheme } }));
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
const initialAppTheme = useAppThemeStore.getState();

function setGame(
  gameType = GameType.Coop,
  gamePermissions = GamePermission.Player,
) {
  useGameStore.setState({
    gamePermissions,
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
  // jsdom has no PointerEvent, which Base UI's radios press with.
  window.PointerEvent ??= MouseEvent as unknown as typeof PointerEvent;
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
  useAppThemeStore.setState(initialAppTheme, true);
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
      "Edit Access",
      "Change Theme",
      "Delete Character",
    ]);

    await user.click(within(menu).getByRole("menuitem", { name: /Theme/ }));
    expect(useMenuState.getState().isThemeDialogOpen).toBe(true);
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
    expect(dialog).toHaveTextContent("Delete Kira?");
    await user.click(
      within(dialog).getByRole("button", { name: "Delete Character" }),
    );
    await waitFor(() => expect(deleteCharacter).toHaveBeenCalledTimes(1));
  });
});

describe("the Theme dialog", () => {
  function openThemeDialog() {
    useMenuState.setState({ isThemeDialogOpen: true });
    render(
      <MemoryRouter>
        <GameThemeDialog />
      </MemoryRouter>,
      { wrapper: TestWrapper },
    );
    return screen.findByRole("dialog", { name: "Theme" });
  }

  async function pick(rowName: string, scheme: RegExp) {
    const user = userEvent.setup();
    const dialog = await screen.findByRole("dialog", { name: "Theme" });
    const change = within(dialog).getByRole("button", {
      name: `Change theme for ${rowName}`,
    });
    if (change.getAttribute("aria-expanded") !== "true") {
      await user.click(change);
    }
    await user.click(
      within(
        within(dialog).getByRole("radiogroup", { name: new RegExp(rowName) }),
      ).getByRole("radio", { name: scheme }),
    );
    return { user, dialog };
  }

  it("saves the character's theme and closes", async () => {
    await openThemeDialog();
    const { user, dialog } = await pick("Kira", /myriad/i);
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateCharacterColorScheme).toHaveBeenCalledWith(
        "kira",
        ColorScheme.Myriad,
      ),
    );
    expect(updateGameColorScheme).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(useMenuState.getState().isThemeDialogOpen).toBe(false),
    );
  });

  it("lets a Guide save the game's theme", async () => {
    setGame(GameType.Coop, GamePermission.Guide);
    await openThemeDialog();
    const { user, dialog } = await pick("Ashfall", /cinder/i);
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateGameColorScheme).toHaveBeenCalledWith(
        "game",
        ColorScheme.Cinder,
      ),
    );
  });

  it("shows a player the game's theme without letting them change it", async () => {
    const dialog = await openThemeDialog();
    expect(
      within(dialog).queryByRole("button", {
        name: "Change theme for Ashfall",
      }),
    ).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent(
      "Only the game's Guides can change its theme.",
    );
  });

  it("saves the Everywhere theme on the person's account", async () => {
    await openThemeDialog();
    const { user, dialog } = await pick("Your app theme", /sunrise/i);
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(setColorScheme).toHaveBeenCalledWith("me", ColorScheme.Default),
    );
    expect(useAppThemeStore.getState().appTheme).toBe(ColorScheme.Default);
  });
});
