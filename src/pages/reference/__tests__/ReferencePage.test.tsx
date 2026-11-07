import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ThemeProvider } from "providers/ThemeProvider";

import { AuthStatus, useAuthStore } from "stores/auth.store";

import ReferencePage from "../ReferencePage";
import { useReferenceBanner } from "../stores/referenceBanner.store";
import { useReferenceSettings } from "../stores/referenceSettings.store";

function LocationDisplay() {
  const location = useLocation();
  return (
    <div data-testid="location">{location.pathname + location.search}</div>
  );
}

async function renderAt(path: string) {
  await act(async () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/reference/*" element={<ReferencePage />} />
          </Routes>
          <LocationDisplay />
        </MemoryRouter>
      </ThemeProvider>,
    );
  });
}

// The real rules packages load, so these wait longer than the default.
const LOAD = { timeout: 10000 };

describe("ReferencePage", () => {
  beforeAll(() => {
    // jsdom has no ResizeObserver; the oracle list's quick roll measures its
    // button with one.
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    localStorage.clear();
    useReferenceSettings.setState({
      lastTabId: undefined,
      sourceVisibility: {},
      lastItemIds: {},
    });
    useReferenceBanner.setState({ dismissed: false });
    useAuthStore.setState({ status: AuthStatus.Authenticated });
  });

  it("opens the Starforged moves list from the bare path", async () => {
    await renderAt("/reference");
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/reference/starforged/moves",
    );
    const category = await screen.findByRole(
      "button",
      { name: /adventure/i },
      LOAD,
    );
    expect(category).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(category);
    expect(screen.getByRole("link", { name: "Face Danger" })).toHaveAttribute(
      "href",
      "/reference/starforged/moves/adventure/face_danger",
    );
  });

  it("opens a move from its link, with its rolls and a way to share it", async () => {
    await renderAt("/reference/starforged/moves/adventure/face_danger");
    expect(
      await screen.findByRole(
        "heading",
        { name: "Face Danger", level: 2 },
        LOAD,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Roll this move" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Copy link" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Face Danger" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("says when an item can't be found", async () => {
    await renderAt("/reference/starforged/moves/adventure/not_a_move");
    expect(
      await screen.findByText("We couldn't find that item", undefined, LOAD),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all moves" })).toHaveAttribute(
      "href",
      "/reference/starforged/moves",
    );
  });

  it("opens the item's own tab and offers the way back", async () => {
    useReferenceSettings.setState({ lastTabId: "classic" });
    await renderAt("/reference/starforged/moves/adventure/face_danger");
    expect(
      await screen.findByText(
        "Opened the Starforged tab for this link.",
        { exact: false },
        LOAD,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to Ironsworn" }),
    ).toHaveAttribute("href", "/reference/classic/moves");
    expect(useReferenceSettings.getState().lastTabId).toBe("starforged");
  });

  it("keeps the open tab when it shows the item", async () => {
    useReferenceSettings.setState({ lastTabId: "sundered_isles" });
    await renderAt("/reference/starforged/moves/adventure/face_danger");
    expect(
      await screen.findByRole(
        "heading",
        { name: "Face Danger", level: 2 },
        LOAD,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sundered Isles" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.queryByText(/for this link/)).not.toBeInTheDocument();
  });

  it("opens an oracle and rolls one from the list", async () => {
    await renderAt("/reference/starforged/oracles/core/action");
    expect(
      await screen.findByRole("heading", { name: "Action", level: 2 }, LOAD),
    ).toBeInTheDocument();
    // The list opens around the open oracle and marks it. Starforged's own
    // Core Oracles show, since Starsmith is off.
    const list = within(screen.getByRole("navigation", { name: "Oracles" }));
    expect(list.getByRole("link", { name: "Action" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(list.getByRole("link", { name: "Action" })).toHaveAttribute(
      "href",
      "/reference/starforged/oracles/core/action",
    );
    await userEvent.click(list.getByRole("button", { name: "Likely" }));
    await userEvent.click(list.getByRole("button", { name: "Roll Action" }));
    expect(
      screen.getByRole("heading", { name: "Action", level: 2 }),
    ).toBeInTheDocument();
  });

  it("lists a collection's assets as cards", async () => {
    await renderAt("/reference/starforged/assets/path");
    expect(
      await screen.findByRole("link", { name: "Path Assets" }, LOAD),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getAllByRole("link", { name: "Open" }).length,
    ).toBeGreaterThan(5);
  });

  it("opens an asset from its link", async () => {
    await renderAt("/reference/starforged/assets/path/empath");
    expect(
      await screen.findByRole("heading", { name: "Empath", level: 2 }, LOAD),
    ).toBeInTheDocument();
  });

  it("shows the rules with an anchor for each group", async () => {
    await renderAt("/reference/classic/rules");
    const stats = await screen.findByRole(
      "heading",
      { name: "Stats", level: 2 },
      LOAD,
    );
    expect(stats.querySelector("#stats")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Condition Meters", level: 2 }),
    ).toBeInTheDocument();
    // Ironsworn's names: debilities, and bonds as a special track.
    expect(
      screen.getByRole("heading", { name: "Debilities", level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Special Tracks", level: 2 }),
    ).toBeInTheDocument();
  });

  it("names Starforged's impacts and legacy tracks", async () => {
    await renderAt("/reference/starforged/rules");
    expect(
      await screen.findByRole("heading", { name: "Impacts", level: 2 }, LOAD),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Legacy Tracks", level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "vehicle troubles", level: 3 }),
    ).toBeInTheDocument();
  });

  it("invites signed out visitors and moves focus to the open tab when dismissed", async () => {
    useAuthStore.setState({ status: AuthStatus.Unauthenticated });
    await renderAt("/reference/starforged/moves");
    const banner = screen.getByRole("region", {
      name: "Keep your character here too",
    });
    expect(banner).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create a character" }),
    ).toHaveAttribute("href", "/auth?continuePath=/games/create");

    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(
      screen.queryByRole("region", { name: "Keep your character here too" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Starforged" })).toHaveFocus();
    expect(useReferenceBanner.getState().dismissed).toBe(true);
  });

  it("doesn't show the invitation to signed in readers", async () => {
    await renderAt("/reference/starforged/moves");
    expect(
      screen.queryByRole("region", { name: "Keep your character here too" }),
    ).not.toBeInTheDocument();
  });
});
