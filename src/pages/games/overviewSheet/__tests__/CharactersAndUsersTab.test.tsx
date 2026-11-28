import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfirmProvider } from "ui/components/ConfirmDialog";

import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useSecondScreenStore } from "stores/secondScreen.store";
import { useUsersStore } from "stores/users.store";

import { GameType } from "repositories/game.repository";

import { ICharacter } from "services/character.service";
import { GamePlayerRole, IGame, IGamePlayer } from "services/game.service";

import { CharactersAndUsersTab } from "../CharactersAndUsersTab";

// Characterization tests for the overview sheet's Characters tab (slice 16):
// the character cards, Add Character, the player cards and their role and
// removal buttons, the invite link and the second screen toggle.

const mocks = vi.hoisted(() => ({
  secondScreen: false,
}));

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({ useUID: () => "me" }));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => "game",
  useGameIdOptional: () => "game",
}));
vi.mock("hooks/advancedFeatures/useSecondScreenFeature", () => ({
  useSecondScreenFeature: () => mocks.secondScreen,
}));

function character(id: string, name: string, uid: string): ICharacter {
  return { id, uid, gameId: "game", name } as unknown as ICharacter;
}

function player(userId: string, role: GamePlayerRole): IGamePlayer {
  return { userId, role, gameId: "game" } as IGamePlayer;
}

const updateGamePlayerRole = vi.fn(() => Promise.resolve());
const removePlayerFromGame = vi.fn(() => Promise.resolve());
const getGameInviteKey = vi.fn(() => Promise.resolve("invite-key"));
const updateSecondScreenSettings = vi.fn(() => Promise.resolve());

function setGame(
  gameType: GameType,
  permission: GamePermission,
  players: Record<string, GamePlayerRole> = {},
) {
  useGameStore.setState({
    game: { id: "game", gameType } as unknown as IGame,
    gamePermissions: permission,
    gamePlayers: Object.fromEntries(
      Object.entries(players).map(([uid, role]) => [uid, player(uid, role)]),
    ),
    updateGamePlayerRole,
    removePlayerFromGame,
    getGameInviteKey,
  });
}

beforeEach(() => {
  mocks.secondScreen = false;
  vi.clearAllMocks();
  useUsersStore.setState({
    users: {
      me: { loading: false, user: { name: "Scott" } },
      vex: { loading: false, user: { name: "Vex's player" } },
    },
  });
  useGameCharactersStore.setState({
    loading: false,
    characters: {
      kira: character("kira", "Kira", "me"),
      rook: character("rook", "Rook", "vex"),
    },
  });
  useSecondScreenStore.setState({ settings: null, updateSecondScreenSettings });
});

function renderTab() {
  return render(
    <MemoryRouter>
      <ConfirmProvider>
        <CharactersAndUsersTab />
      </ConfirmProvider>
    </MemoryRouter>,
  );
}

function playerCard(name: string) {
  const heading = screen.getByRole("heading", { name });
  const card = heading.closest("article, .MuiCard-root");
  if (!(card instanceof HTMLElement)) throw new Error(`No card for ${name}`);
  return within(card);
}

describe("overview Characters tab", () => {
  it("links each character to its sheet", () => {
    setGame(GameType.Solo, GamePermission.Player);
    renderTab();

    expect(screen.getByRole("heading", { name: "Characters" })).toBeVisible();
    expect(screen.getByRole("link", { name: /Kira/ })).toHaveAttribute(
      "href",
      "/games/game/c/kira",
    );
    expect(screen.getByRole("link", { name: /Rook/ })).toHaveAttribute(
      "href",
      "/games/game/c/rook",
    );
  });

  it("offers Add Character to everyone but viewers", () => {
    setGame(GameType.Coop, GamePermission.Player, {
      me: GamePlayerRole.Player,
    });
    const { unmount } = renderTab();
    expect(screen.getByRole("link", { name: "Add Character" })).toHaveAttribute(
      "href",
      "/games/game/create",
    );
    unmount();

    setGame(GameType.Coop, GamePermission.Viewer, {
      me: GamePlayerRole.Player,
    });
    renderTab();
    expect(
      screen.queryByRole("link", { name: "Add Character" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy Invite Link" }),
    ).not.toBeInTheDocument();
  });

  it("shows no players or player names in a solo game", () => {
    setGame(GameType.Solo, GamePermission.Player, {
      me: GamePlayerRole.Player,
    });
    renderTab();

    expect(
      screen.queryByRole("heading", { name: "Players" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Scott")).not.toBeInTheDocument();
    expect(getGameInviteKey).not.toHaveBeenCalled();
  });

  it("lists players with their characters' owners in a co-op game", async () => {
    setGame(GameType.Coop, GamePermission.Player, {
      me: GamePlayerRole.Player,
      vex: GamePlayerRole.Player,
    });
    renderTab();

    expect(screen.getByRole("heading", { name: "Players" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Scott" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Vex's player" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Rook.*Vex's player/ }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Copy Invite Link" }),
    ).toBeVisible();
    await waitFor(() => expect(getGameInviteKey).toHaveBeenCalledWith("game"));
  });

  it("lets a player with no Guide take the role, and leave the game", () => {
    setGame(GameType.Coop, GamePermission.Player, {
      me: GamePlayerRole.Player,
      vex: GamePlayerRole.Player,
    });
    renderTab();

    const mine = playerCard("Scott");
    expect(mine.getByRole("button", { name: "Make Guide" })).toBeVisible();
    expect(mine.getByRole("button", { name: "Leave Game" })).toBeVisible();

    const theirs = playerCard("Vex's player");
    expect(theirs.queryAllByRole("button")).toHaveLength(0);
  });

  it("gives a Guide role and removal buttons for everyone", async () => {
    const user = userEvent.setup();
    setGame(GameType.Guided, GamePermission.Guide, {
      me: GamePlayerRole.Guide,
      vex: GamePlayerRole.Player,
    });
    renderTab();

    const mine = playerCard("Scott");
    expect(mine.getByText("Guide")).toBeVisible();
    expect(
      mine.queryByRole("button", { name: "Make Guide" }),
    ).not.toBeInTheDocument();
    await user.click(mine.getByRole("button", { name: "Leave Guide Role" }));
    expect(updateGamePlayerRole).toHaveBeenCalledWith(
      "game",
      "me",
      GamePlayerRole.Player,
    );

    const theirs = playerCard("Vex's player");
    expect(theirs.getByText("Player")).toBeVisible();
    await user.click(theirs.getByRole("button", { name: "Make Guide" }));
    expect(updateGamePlayerRole).toHaveBeenCalledWith(
      "game",
      "vex",
      GamePlayerRole.Guide,
    );

    await user.click(theirs.getByRole("button", { name: "Kick Player" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Remove User" }),
    );
    await waitFor(() =>
      expect(removePlayerFromGame).toHaveBeenCalledWith("game", "vex", [
        "rook",
      ]),
    );
  });

  it("keeps the player when removal is cancelled", async () => {
    const user = userEvent.setup();
    setGame(GameType.Guided, GamePermission.Guide, {
      me: GamePlayerRole.Guide,
      vex: GamePlayerRole.Player,
    });
    renderTab();

    await user.click(
      playerCard("Vex's player").getByRole("button", { name: "Kick Player" }),
    );
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(removePlayerFromGame).not.toHaveBeenCalled();
  });

  it("opens a character on the second screen and takes it off again", async () => {
    const user = userEvent.setup();
    mocks.secondScreen = true;
    setGame(GameType.Guided, GamePermission.Guide, {
      me: GamePlayerRole.Guide,
    });
    renderTab();

    const [openKira] = screen.getAllByRole("button", {
      name: "Open on Screen",
    });
    await user.click(openKira);
    expect(updateSecondScreenSettings).toHaveBeenCalledWith("game", {
      type: "character",
      characterId: "kira",
    });

    act(() =>
      useSecondScreenStore.setState({
        settings: { type: "character", characterId: "kira" },
      }),
    );
    await user.click(screen.getByRole("button", { name: "On Screen" }));
    expect(updateSecondScreenSettings).toHaveBeenLastCalledWith("game", null);
  });
});
