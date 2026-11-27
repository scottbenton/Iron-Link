import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameCharacterDisplayDetails } from "stores/users.games.store";

import { GameType } from "repositories/game.repository";

import type { IGame } from "services/game.service";

import GameSelectPage from "../GameSelectPage";

// Characterization tests for the games list (slice 8): the page heading and
// Create Game, its loading, error and empty states, and what each card says.

interface MockGamesState {
  games: Record<string, IGame>;
  characterDisplayDetails: Record<
    string,
    Record<string, GameCharacterDisplayDetails>
  >;
  loading: boolean;
  error?: Error;
}

const mocks = vi.hoisted(() => ({
  state: {
    games: {},
    characterDisplayDetails: {},
    loading: false,
  } as MockGamesState,
  loadUsersGames: vi.fn(),
}));

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("hooks/useSendPageViewEvents", () => ({
  PageCategory: { GameSelect: "game-select" },
  useSendPageViewEvent: () => {},
}));
vi.mock("stores/auth.store", () => ({ useUID: () => "me" }));
vi.mock("stores/character.store", () => ({
  useLoadCharacterPortrait: () => {},
  useCharacterPortrait: () => ({ url: undefined }),
}));
vi.mock("stores/users.games.store", () => ({
  useLoadUsersGames: () => mocks.loadUsersGames(),
  useUsersGames: (selector?: (state: MockGamesState) => unknown) =>
    selector ? selector(mocks.state) : mocks.state,
}));

function game(overrides: Partial<IGame>): IGame {
  return {
    id: "game",
    name: "Game",
    worldId: null,
    conditionMeters: {},
    specialTracks: {},
    gameType: GameType.Coop,
    colorScheme: null,
    rulesets: {},
    expansions: {},
    playset: {},
    ...overrides,
  };
}

function character(name: string, uid = "someone"): GameCharacterDisplayDetails {
  return { name, uid, profileImageSettings: null, profileImageURL: null };
}

/** A game's card: the list item holding its h2. */
function getCard(name: string) {
  const card = screen
    .getAllByRole("listitem")
    .find((item) => within(item).queryByRole("heading", { name }));
  if (!card) throw new Error(`No card for ${name}`);
  return card;
}

function renderPage() {
  return render(
    <MemoryRouter>
      <GameSelectPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.state = { games: {}, characterDisplayDetails: {}, loading: false };
  mocks.loadUsersGames.mockClear();
});

describe("GameSelectPage", () => {
  it("names the page and links to Create Game", () => {
    mocks.state.games = { a: game({ id: "a", name: "Ashes" }) };
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Your Games" }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Your Games | Iron Link");
    expect(screen.getByRole("link", { name: "Create Game" })).toHaveAttribute(
      "href",
      "/games/create",
    );
    expect(mocks.loadUsersGames).toHaveBeenCalled();
  });

  it("shows progress while the games load", () => {
    mocks.state.loading = true;
    renderPage();

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("No games found")).not.toBeInTheDocument();
  });

  it("says when the games could not be loaded", () => {
    mocks.state.error = new Error("nope");
    renderPage();

    expect(
      screen.getByText("Failed to load your games. Please try again later."),
    ).toBeInTheDocument();
  });

  it("offers Create Game when there are no games", () => {
    renderPage();

    expect(screen.getByText("No games found")).toBeInTheDocument();
    // One in the header, one in the empty state.
    expect(screen.getAllByRole("link", { name: "Create Game" })).toHaveLength(
      2,
    );
  });

  it("shows a card per game with its rules and characters", () => {
    mocks.state.games = {
      expanse: game({
        id: "expanse",
        name: "The Iron Expanse",
        rulesets: { starforged: true, classic: false },
        expansions: {
          starforged: { sundered_isles: true, starsmith: false },
          classic: { delve: true },
        },
      }),
      ashes: game({
        id: "ashes",
        name: "Ashes of the Forge",
        rulesets: { classic: true },
        expansions: { classic: { delve: true } },
      }),
    };
    mocks.state.characterDisplayDetails = {
      expanse: {
        c1: character("Orrin Thale"),
        c2: character("Kira Vale", "me"),
      },
    };
    renderPage();

    const expanse = getCard("The Iron Expanse");
    // The game's name is the card's h2 and its link.
    const expanseHeading = within(expanse).getByRole("heading", {
      level: 2,
      name: "The Iron Expanse",
    });
    expect(
      within(expanseHeading).getByRole("link", { name: "The Iron Expanse" }),
    ).toHaveAttribute("href", "/games/expanse");
    // Inactive rulesets and expansions are left out.
    expect(
      within(expanse).getByText("Starforged, Sundered Isles"),
    ).toBeVisible();
    expect(
      within(expanse).getByText("Characters: Kira Vale, Orrin Thale"),
    ).toBeInTheDocument();

    const ashes = getCard("Ashes of the Forge");
    expect(
      within(ashes).getByRole("link", { name: "Ashes of the Forge" }),
    ).toHaveAttribute("href", "/games/ashes");
    expect(within(ashes).getByText("Ironsworn, Delve")).toBeVisible();
    expect(within(ashes).queryByText(/^Characters:/)).not.toBeInTheDocument();
  });

  it("counts the characters past three when there are more than four", () => {
    mocks.state.games = { crowd: game({ id: "crowd", name: "Crowd" }) };
    mocks.state.characterDisplayDetails = {
      crowd: Object.fromEntries(
        ["Ada", "Bryn", "Cass", "Dax", "Eir", "Fen"].map((name) => [
          name,
          character(name),
        ]),
      ),
    };
    renderPage();

    const card = getCard("Crowd");
    // A picture only: the names are read in the card's text.
    expect(within(card).getByText("+3")).toBeInTheDocument();
    expect(
      within(card).getByText("Characters: Ada, Bryn, Cass, Dax, Eir, Fen"),
    ).toBeInTheDocument();
  });
});
