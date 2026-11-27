import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGameStore } from "stores/game.store";
import { useSecondScreenStore } from "stores/secondScreen.store";

import { TestWrapper } from "tests/TestWrapper";

import SecondScreenPage from "../SecondScreenPage";

// Pins the second screen's frame: loading, the document title, the default
// screen, the note image screen and the characters column beside the main
// screen. The character, track and world entry screens are stand-ins.

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("hooks/useSendPageViewEvents", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useSendPageViewEvent: () => {},
}));
vi.mock("pages/games/gamePageLayout/hooks/useSyncGame", () => ({
  useSyncGame: () => {},
}));
vi.mock("pages/games/hooks/useSyncColorScheme", () => ({
  useSyncColorScheme: () => {},
}));
vi.mock("stores/secondScreen.store", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useSyncSecondScreenSettings: () => {},
}));
vi.mock("../CharacterSidebar", () => ({
  CharacterSidebar: () => <p>Characters column</p>,
}));
vi.mock("../CharacterMain", () => ({
  CharacterMain: (props: { characterId: string }) => (
    <p>Character screen {props.characterId}</p>
  ),
}));
vi.mock("../TrackScreenMain", () => ({
  TrackScreenMain: (props: { trackId: string }) => (
    <p>Track screen {props.trackId}</p>
  ),
}));
vi.mock("../WorldEntryMain", () => ({
  WorldEntryMain: (props: { entryId: string }) => (
    <p>World entry screen {props.entryId}</p>
  ),
}));

function renderSecondScreen() {
  return render(
    <TestWrapper>
      <MemoryRouter initialEntries={["/games/game-1/display"]}>
        <Routes>
          <Route path="/games/:gameId/display" Component={SecondScreenPage} />
        </Routes>
      </MemoryRouter>
    </TestWrapper>,
  );
}

function setDisplay(
  settings: ReturnType<typeof useSecondScreenStore.getState>["settings"],
  areAllCharactersVisible = false,
) {
  useSecondScreenStore.setState({
    loading: false,
    settings,
    areAllCharactersVisible,
  });
}

beforeEach(() => {
  useGameStore.setState({ game: { name: "Ashen Reach" } as never });
  setDisplay(null);
});
afterEach(() => {
  document.title = "";
});

describe("SecondScreenPage", () => {
  it("shows a progress bar while its settings load", () => {
    useSecondScreenStore.setState({ loading: true });
    renderSecondScreen();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("names the browser tab after the game", () => {
    renderSecondScreen();
    expect(document.title).toBe("Second Screen | Ashen Reach | Iron Link");
  });

  it("shows the game's name when nothing is on screen", () => {
    renderSecondScreen();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Ashen Reach",
    );
  });

  it("shows a note image with its label as the heading", () => {
    setDisplay({
      type: "note_image",
      url: "https://img/map.png",
      label: "Map",
    });
    const { container } = renderSecondScreen();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://img/map.png",
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Map");
  });

  it("leaves out the label of a note image that has none", () => {
    setDisplay({ type: "note_image", url: "https://img/map.png", label: " " });
    renderSecondScreen();
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it.each([
    [{ type: "character", characterId: "c-1" }, "Character screen c-1"],
    [{ type: "track", trackId: "t-1" }, "Track screen t-1"],
    [
      { type: "world_entry", worldId: "w-1", entryId: "e-1" },
      "World entry screen e-1",
    ],
  ] as const)("shows the screen for %o", (settings, text) => {
    setDisplay(settings as never);
    renderSecondScreen();
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("shows the characters beside the screen only when asked to", () => {
    const { unmount } = renderSecondScreen();
    expect(screen.queryByText("Characters column")).toBeNull();
    unmount();

    setDisplay(null, true);
    renderSecondScreen();
    expect(screen.getByText("Characters column")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Ashen Reach",
    );
  });
});
