import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { useCreateGameStore } from "stores/createGame.store";

import { GameType } from "repositories/game.repository";

import CreateGamePage from "../CreateGamePage";

// Characterization tests for create game (slice 8): its steps for each game
// type, moving between them, and creating a co-op game. The character step
// stays on MUI until slice 16, so it is stubbed here.

const mocks = vi.hoisted(() => ({
  createGame: vi.fn(),
}));

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("hooks/useSendPageViewEvents", () => ({
  PageCategory: { GameCreate: "game-create" },
  useSendPageViewEvent: () => {},
}));
vi.mock("stores/auth.store", () => ({ useUID: () => "me" }));
vi.mock("services/game.service", () => ({
  GameService: { createGame: mocks.createGame },
}));
vi.mock("../components/CreateCharacterStep", () => ({
  CreateCharacterStep: () => <p>Character step</p>,
}));
vi.mock("../components/SyncRulesPackages", () => ({
  SyncRulesPackages: () => null,
}));

function LocationDisplay() {
  const location = useLocation();
  return <output aria-label="Location">{location.pathname}</output>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/games/create"]}>
      <Routes>
        <Route path="/games/create" element={<CreateGamePage />} />
        <Route path="*" element={null} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>,
  );
}

function getStepLabels() {
  return ["Choose Game Type", "Choose Rulesets", "Create Character"].map(
    (label) => screen.queryAllByText(label).length > 0,
  );
}

beforeAll(() => {
  // Base UI's radio cards replay a click as a PointerEvent, which jsdom lacks.
  window.PointerEvent ??= MouseEvent as unknown as typeof PointerEvent;
});

beforeEach(() => {
  mocks.createGame.mockReset();
});

afterEach(() => {
  act(() => useCreateGameStore.getState().reset());
});

describe("CreateGamePage", () => {
  it("starts on the game type, with Solo chosen", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "New Game" }),
    ).toBeInTheDocument();
    expect(document.title).toBe("New Game | Iron Link");
    expect(getStepLabels()).toEqual([true, true, true]);

    expect(screen.getByRole("radio", { name: /Solo/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Co-op/ })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /Guided/ })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("ends a co-op or guided game with its details instead of a character", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText("Co-op"));
    expect(screen.getByRole("radio", { name: /Co-op/ })).toBeChecked();
    expect(screen.getByText("Game Details")).toBeInTheDocument();
    expect(screen.queryByText("Create Character")).not.toBeInTheDocument();
  });

  it("moves forward and back between the steps", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(
      screen.getByRole("checkbox", { name: /^Starforged/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("radio", { name: /Solo/ })).toBeChecked();
  });

  it("stays on the rules step until a ruleset is chosen", async () => {
    // Before the swap, Next skipped this check and moved on with no ruleset.
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please select at least one ruleset",
    );
    expect(screen.queryByText("Character step")).not.toBeInTheDocument();

    await user.click(screen.getByText("Starforged"));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Character step")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Character" }),
    ).toBeInTheDocument();
  });

  it("goes back to a finished step from its step label", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: /^Choose Game Type/ }));
    expect(screen.getByRole("radio", { name: /Solo/ })).toBeChecked();
  });

  it("creates a co-op game and opens it", async () => {
    const user = userEvent.setup();
    mocks.createGame.mockResolvedValue("new-game");
    renderPage();

    await user.click(screen.getByText("Co-op"));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByText("Starforged"));
    await user.click(screen.getByRole("button", { name: "Next" }));

    // No name yet.
    await user.click(screen.getByRole("button", { name: "Create Game" }));
    expect(screen.getByText("Please enter a name")).toBeInTheDocument();
    expect(mocks.createGame).not.toHaveBeenCalled();

    await user.type(
      screen.getByRole("textbox", { name: "Game Name" }),
      "The Iron Expanse",
    );
    await user.click(screen.getByRole("button", { name: "Create Game" }));

    expect(mocks.createGame).toHaveBeenCalledWith(
      "me",
      "The Iron Expanse",
      GameType.Coop,
      { starforged: true },
      {},
      {},
    );
    expect(
      await screen.findByRole("status", { name: "Location" }),
    ).toHaveTextContent("/games/new-game");
  });

  it("says when the game could not be created", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.createGame.mockRejectedValue(new Error("nope"));
    renderPage();

    await user.click(screen.getByText("Co-op"));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByText("Starforged"));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.type(
      screen.getByRole("textbox", { name: "Game Name" }),
      "The Iron Expanse",
    );
    await user.click(screen.getByRole("button", { name: "Create Game" }));

    expect(await screen.findByText("Error creating game")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Game" })).toBeEnabled();
  });
});
