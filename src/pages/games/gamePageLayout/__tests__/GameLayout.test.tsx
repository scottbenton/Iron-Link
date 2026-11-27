import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "stores/auth.store";
import { useDataswornTreeStore } from "stores/dataswornTree.store";
import { useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

import { TestWrapper } from "tests/TestWrapper";
import { mockWindowWidth } from "tests/mockWindowWidth";

import GameLayout from "../GameLayout";
import { GAME_TAB_ID } from "../hooks/useGameKeybinds";

// Pins what the game page's frame shows at each width: its tabs, heading,
// columns, phone sections, loading and error states, document titles and
// the worlds beta banner. The pages inside it (overview, character sheet,
// character creation), the notes and the reference column are stand-ins,
// so this covers only the frame around them.

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

// The page's subscriptions and settings contributions talk to the backend.
vi.mock("../hooks/useSyncGame", () => ({ useSyncGame: () => {} }));
vi.mock("../hooks/useSyncOpenNoteItem", () => ({
  useSyncOpenNoteItem: () => {},
}));
vi.mock("pages/games/hooks/useSyncColorScheme", () => ({
  useSyncColorScheme: () => {},
}));
vi.mock("stores/secondScreen.store", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useSyncSecondScreenSettingsIfActive: () => {},
}));
vi.mock("../GameSettings", () => ({ GameSettings: () => null }));
vi.mock("components/Layout/AppSettingsMenu", () => ({
  AppSettingsMenu: () => <button type="button">Settings</button>,
}));

vi.mock("../../characterSheet/components/NotesSection", () => ({
  NotesSection: () => <p>Notes column</p>,
}));
vi.mock("../../characterSheet/components/ReferenceSidebarContents", () => ({
  ReferenceSidebarContents: () => <p>Reference column</p>,
}));

const banner = vi.hoisted(() => ({ show: false }));
vi.mock("hooks/advancedFeatures/worldsBetaBanner", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useShowWorldsBetaBanner: () => banner.show,
}));

const GAME_ID = "game-1";

let navigateTo: (path: string) => void = () => {};
function NavigateCapture() {
  const navigate = useNavigate();
  navigateTo = (path) => navigate(path);
  return null;
}

function renderGamePage(path: string) {
  return render(
    <TestWrapper>
      <MemoryRouter initialEntries={[path]}>
        <NavigateCapture />
        <Routes>
          <Route path="/games/:gameId" Component={GameLayout}>
            <Route index element={<p>Overview page</p>} />
            <Route path="c/:characterId" element={<p>Character page</p>} />
            <Route path="create" element={<p>Create page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </TestWrapper>,
  );
}

function setGame(name: string | null) {
  useGameStore.setState({
    gameId: GAME_ID,
    game: name ? ({ name, worldId: null } as never) : null,
    loading: !name,
    error: undefined,
  });
}

function setCharacters(
  characters: { id: string; name: string; uid: string }[],
) {
  useGameCharactersStore.setState({
    loading: false,
    characters: Object.fromEntries(
      characters.map(({ id, name, uid }) => [id, { name, uid } as never]),
    ),
  });
}

// The game's page tabs, in order, with each one's destination.
function gameTabs() {
  const nav = screen.queryByRole("navigation", { name: "Game Pages" });
  return nav ? within(nav).getAllByRole("link") : [];
}
function currentGameTab() {
  return gameTabs().find((tab) => tab.getAttribute("aria-current") === "page");
}

// The phone's bottom bar of sections.
function sectionButtons() {
  return within(
    screen.getByRole("navigation", { name: "Game Sections" }),
  ).getAllByRole("button");
}
function sectionButton(name: string) {
  return within(
    screen.getByRole("navigation", { name: "Game Sections" }),
  ).getByRole("button", { name });
}

let restoreWidth = () => {};
function atWidth(width: number) {
  restoreWidth = mockWindowWidth(width);
}

beforeEach(() => {
  // jsdom has no scrollBy; the page tabs scroll the current one into view.
  Element.prototype.scrollBy ??= () => {};
  banner.show = false;
  useAuthStore.setState({ uid: "me" });
  useDataswornTreeStore.setState({ rulesError: null });
  setGame("Ashen Reach");
  setCharacters([
    { id: "c-zed", name: "Zed", uid: "someone" },
    { id: "c-ash", name: "Ash", uid: "someone" },
    { id: "c-mine", name: "Wren", uid: "me" },
  ]);
});

afterEach(() => {
  restoreWidth();
  document.title = "";
});

describe("GameLayout loading and errors", () => {
  it("shows a progress bar until the game loads", () => {
    atWidth(1280);
    setGame(null);
    renderGamePage(`/games/${GAME_ID}`);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("Overview page")).not.toBeInTheDocument();
  });

  it("says when the game failed to load", () => {
    atWidth(1280);
    useGameStore.setState({ game: null, error: "boom" });
    renderGamePage(`/games/${GAME_ID}`);
    expect(screen.getByText("Failed to load game.")).toBeInTheDocument();
    expect(screen.queryByText("Overview page")).not.toBeInTheDocument();
  });

  it("says when the rules package failed to load", () => {
    atWidth(1280);
    useDataswornTreeStore.setState({ rulesError: "boom" });
    renderGamePage(`/games/${GAME_ID}`);
    expect(
      screen.getByText("Failed to load rules package."),
    ).toBeInTheDocument();
  });
});

describe("GameLayout document title", () => {
  it.each([
    [`/games/${GAME_ID}`, "Ashen Reach | Iron Link"],
    [`/games/${GAME_ID}/c/c-ash`, "Ash | Ashen Reach | Iron Link"],
    [`/games/${GAME_ID}/create`, "Add Character | Ashen Reach | Iron Link"],
  ])("on %s is %s", (path, title) => {
    atWidth(1280);
    renderGamePage(path);
    expect(document.title).toBe(title);
  });

  it("waits for the character's name before naming a character page", () => {
    atWidth(1280);
    renderGamePage(`/games/${GAME_ID}/c/unknown`);
    expect(document.title).toBe("Iron Link");
  });
});

// From 600px: wide (1200px and up), medium (from 900px) and compact.
describe.each([1280, 1000, 700])("GameLayout at %spx", (width) => {
  beforeEach(() => atWidth(width));

  it("lists the overview, your characters first, then Add Character", () => {
    renderGamePage(`/games/${GAME_ID}`);
    expect(
      gameTabs().map((tab) => [tab.textContent, tab.getAttribute("href")]),
    ).toEqual([
      ["Overview", `/games/${GAME_ID}`],
      ["Wren", `/games/${GAME_ID}/c/c-mine`],
      ["Ash", `/games/${GAME_ID}/c/c-ash`],
      ["Zed", `/games/${GAME_ID}/c/c-zed`],
      ["Add Character", `/games/${GAME_ID}/create`],
    ]);
    expect(gameTabs()[0]).toHaveAttribute("id", GAME_TAB_ID);
  });

  it("marks the tab of the page you are on", () => {
    const { unmount } = renderGamePage(`/games/${GAME_ID}`);
    expect(currentGameTab()).toHaveTextContent("Overview");
    unmount();

    renderGamePage(`/games/${GAME_ID}/c/c-ash`);
    expect(currentGameTab()).toHaveTextContent("Ash");
  });

  it("hides the tabs while the characters load", () => {
    useGameCharactersStore.setState({ loading: true });
    renderGamePage(`/games/${GAME_ID}`);
    expect(gameTabs()).toHaveLength(0);
  });

  it("names the page after the game or the character", () => {
    const { unmount } = renderGamePage(`/games/${GAME_ID}`);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Ashen Reach",
    );
    unmount();

    renderGamePage(`/games/${GAME_ID}/c/c-ash`);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ash");
  });

  it("shows the notes, with the page and the reference beside them", () => {
    renderGamePage(`/games/${GAME_ID}/c/c-ash`);
    expect(screen.getByText("Notes column")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Notes" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Go Back" })).toBeNull();
    expect(
      screen.queryByRole("navigation", { name: "Game Sections" }),
    ).toBeNull();
  });

  it("shows character creation alone under the tabs", () => {
    renderGamePage(`/games/${GAME_ID}/create`);
    expect(currentGameTab()).toHaveTextContent("Add Character");
    expect(screen.getByText("Create page")).toBeVisible();
    expect(screen.queryByText("Notes column")).toBeNull();
    expect(screen.queryByText("Reference column")).toBeNull();
  });
});

describe.each([1280, 1000])("GameLayout at %spx", (width) => {
  beforeEach(() => atWidth(width));

  it("keeps the page and the reference open beside the notes", () => {
    renderGamePage(`/games/${GAME_ID}/c/c-ash`);
    expect(screen.getByText("Character page")).toBeVisible();
    expect(screen.getByText("Reference column")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Character" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Reference" }),
    ).toBeInTheDocument();
  });

  it("titles the start column Game Overview on the overview", () => {
    renderGamePage(`/games/${GAME_ID}`);
    expect(
      screen.getByRole("heading", { name: "Game Overview" }),
    ).toBeInTheDocument();
  });
});

// 600 to 900px: the page and the reference wait on one rail and open over
// the notes.
describe("GameLayout at 700px", () => {
  beforeEach(() => atWidth(700));

  it("puts the page and the reference on a rail", () => {
    renderGamePage(`/games/${GAME_ID}/c/c-ash`);
    // The flyouts stay mounted, so each keeps its place while closed.
    expect(screen.queryByText("Character page")).not.toBeVisible();
    expect(screen.queryByText("Reference column")).not.toBeVisible();
    expect(screen.getByText("Notes column")).toBeVisible();
  });
});

// Phones, below 600px, show one section at a time.
describe("GameLayout at 375px", () => {
  const width = 375;
  beforeEach(() => atWidth(width));

  it("goes back to the game list from the overview", () => {
    renderGamePage(`/games/${GAME_ID}`);
    expect(screen.getByRole("link", { name: "Go Back" })).toHaveAttribute(
      "href",
      "/games",
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Ashen Reach",
    );
  });

  it("goes back to the game from a character", () => {
    renderGamePage(`/games/${GAME_ID}/c/c-ash`);
    expect(screen.getByRole("link", { name: "Go Back" })).toHaveAttribute(
      "href",
      `/games/${GAME_ID}`,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ash");
  });

  it("has no page tabs", () => {
    renderGamePage(`/games/${GAME_ID}`);
    expect(gameTabs()).toHaveLength(0);
  });

  it("shows one section at a time, starting with the page", async () => {
    renderGamePage(`/games/${GAME_ID}/c/c-ash`);
    expect(sectionButtons().map((button) => button.textContent)).toEqual([
      "Character",
      "Notes",
      "Reference",
    ]);
    expect(sectionButton("Character")).toHaveAttribute("aria-current");
    expect(screen.getByText("Character page")).toBeVisible();
    expect(screen.getByText("Notes column")).not.toBeVisible();

    await userEvent.click(sectionButton("Notes"));
    expect(screen.getByText("Notes column")).toBeVisible();
    expect(screen.queryByText("Character page")).not.toBeVisible();

    await userEvent.click(sectionButton("Reference"));
    expect(screen.getByText("Reference column")).toBeVisible();
  });

  it("names the first section Overview on the overview", () => {
    renderGamePage(`/games/${GAME_ID}`);
    expect(sectionButtons()[0]).toHaveTextContent("Overview");
  });

  it("goes back to the page section on moving to another page", async () => {
    renderGamePage(`/games/${GAME_ID}/c/c-ash`);
    await userEvent.click(sectionButton("Notes"));
    act(() => navigateTo(`/games/${GAME_ID}/c/c-zed`));
    expect(screen.getByText("Character page")).toBeVisible();
    expect(screen.getByText("Notes column")).not.toBeVisible();
  });

  it("shows character creation with no sections", () => {
    renderGamePage(`/games/${GAME_ID}/create`);
    expect(screen.getByRole("link", { name: "Go Back" })).toHaveAttribute(
      "href",
      `/games/${GAME_ID}`,
    );
    expect(
      screen.queryByRole("navigation", { name: "Game Sections" }),
    ).toBeNull();
    expect(screen.getByText("Create page")).toBeVisible();
  });
});

describe("GameLayout worlds beta banner", () => {
  it("shows above the page when the game has a world", () => {
    atWidth(1280);
    banner.show = true;
    renderGamePage(`/games/${GAME_ID}`);
    expect(screen.getByText("This game has a world")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Turn on the beta" }),
    ).toBeVisible();
  });

  it("is absent otherwise", () => {
    atWidth(1280);
    renderGamePage(`/games/${GAME_ID}`);
    expect(screen.queryByText("This game has a world")).toBeNull();
  });
});
