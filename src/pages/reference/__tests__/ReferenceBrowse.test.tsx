import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { ThemeProvider } from "providers/ThemeProvider";

import { useAppState } from "stores/appState.store";
import { AuthStatus, useAuthStore } from "stores/auth.store";

import ReferencePage from "../ReferencePage";
import { useReferenceBanner } from "../stores/referenceBanner.store";
import { useReferenceSettings } from "../stores/referenceSettings.store";

// Characterizes the reference page's lists, filters and item pages, so the
// move to the UI library keeps what readers rely on.

async function renderAt(path: string) {
  await act(async () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/reference/*" element={<ReferencePage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );
  });
}

// The real rules packages load, so these wait longer than the default.
const LOAD = { timeout: 10000 };

describe("Reference lists and pages", () => {
  beforeAll(() => {
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
    useAppState.setState({ announcement: null });
  });

  it("names the page with one h1 and each list with an h2", async () => {
    await renderAt("/reference/starforged/moves");
    await screen.findByRole("navigation", { name: "Moves" }, LOAD);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Reference", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Moves", level: 2 }),
    ).toBeInTheDocument();
    // Systems are tabs that are links; the open one is the current page.
    const starforged = screen.getByRole("tab", { name: "Starforged" });
    expect(starforged).toHaveAttribute("aria-selected", "true");
    expect(starforged).toHaveAttribute("href", "/reference/starforged/moves");
  });

  it("filters the moves list by name and reads the count", async () => {
    const user = userEvent.setup();
    await renderAt("/reference/starforged/moves");
    const list = within(
      await screen.findByRole("navigation", { name: "Moves" }, LOAD),
    );
    await user.type(list.getByRole("textbox"), "face");

    // A filter opens every category that still has a match.
    expect(
      await list.findByRole("link", { name: "Face Danger" }),
    ).toHaveAttribute(
      "href",
      "/reference/starforged/moves/adventure/face_danger",
    );
    expect(
      list.queryByRole("link", { name: "Secure an Advantage" }),
    ).not.toBeInTheDocument();
    await waitFor(
      () =>
        expect(useAppState.getState().announcement).toMatch(/moves? found$/),
      { timeout: 3000 },
    );

    await user.clear(list.getByRole("textbox"));
    await user.type(list.getByRole("textbox"), "zzzz");
    await waitFor(
      () => expect(useAppState.getState().announcement).toBe("No moves found"),
      { timeout: 3000 },
    );
  });

  it("filters the oracles list by name", async () => {
    const user = userEvent.setup();
    await renderAt("/reference/starforged/oracles");
    const list = within(
      await screen.findByRole("navigation", { name: "Oracles" }, LOAD),
    );
    await user.type(list.getByRole("textbox"), "theme");
    expect(await list.findByRole("link", { name: "Theme" })).toHaveAttribute(
      "href",
      "/reference/starforged/oracles/core/theme",
    );
    expect(
      list.queryByRole("link", { name: "Action" }),
    ).not.toBeInTheDocument();
  });

  it("turns a source on and off from the Sources menu", async () => {
    const user = userEvent.setup();
    await renderAt("/reference/starforged/oracles");
    await screen.findByRole("navigation", { name: "Oracles" }, LOAD);

    await user.click(screen.getByRole("button", { name: "Sources" }));
    const starsmith = await screen.findByRole("menuitemcheckbox", {
      name: /Starsmith/,
    });
    expect(starsmith).toHaveAttribute("aria-checked", "false");
    await user.click(starsmith);
    expect(
      screen.getByRole("menuitemcheckbox", { name: /Starsmith/ }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      useReferenceSettings.getState().sourceVisibility.starforged?.starsmith,
    ).toBe(true);
  });

  it("opens a move's category with a link to every move in it", async () => {
    await renderAt("/reference/starforged/moves/adventure");
    expect(
      await screen.findByRole(
        "heading",
        { name: "Adventure Moves", level: 2 },
        LOAD,
      ),
    ).toBeInTheDocument();
    const contents = screen.getByRole("heading", {
      name: "In this collection",
      level: 3,
    });
    expect(contents).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: "Face Danger" });
    expect(links.length).toBeGreaterThanOrEqual(1);
    links.forEach((link) =>
      expect(link).toHaveAttribute(
        "href",
        "/reference/starforged/moves/adventure/face_danger",
      ),
    );
  });

  it("leads a move's page back to its category", async () => {
    await renderAt("/reference/starforged/moves/adventure/face_danger");
    await screen.findByRole("heading", { name: "Face Danger", level: 2 }, LOAD);
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumbs" });
    expect(
      within(crumbs).getByRole("link", { name: "Adventure Moves" }),
    ).toHaveAttribute("href", "/reference/starforged/moves/adventure");
  });

  it("shows a move's tables on its page", async () => {
    await renderAt("/reference/starforged/moves/fate/pay_the_price");
    await screen.findByRole(
      "heading",
      { name: "Pay the Price", level: 2 },
      LOAD,
    );
    const table = screen.getByRole("table", { name: "Pay the Price" });
    expect(
      within(table).getByRole("columnheader", { name: "Roll" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Result" }),
    ).toBeInTheDocument();
  });

  it("shows an oracle's table and a way to roll it on its page", async () => {
    await renderAt("/reference/starforged/oracles/core/action");
    await screen.findByRole("heading", { name: "Action", level: 2 }, LOAD);
    const table = screen.getByRole("table");
    expect(within(table).getByRole("cell", { name: "Abandon" })).toBeVisible();
    expect(within(table).getByRole("cell", { name: "1" })).toBeVisible();
    // One Roll Action in the list's quick roll, one beside the table.
    expect(
      screen.getAllByRole("button", { name: "Roll Action" }).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("copies a link to the open item", async () => {
    const user = userEvent.setup();
    await renderAt("/reference/starforged/moves/adventure/face_danger");
    await screen.findByRole("heading", { name: "Face Danger", level: 2 }, LOAD);
    await user.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(async () =>
      expect(await navigator.clipboard.readText()).toBe(
        window.location.origin +
          "/reference/starforged/moves/adventure/face_danger",
      ),
    );
  });

  it("marks an item hidden by its source but still opens it", async () => {
    // Starsmith is off by default in Starforged's lists.
    await renderAt(
      "/reference/starsmith/oracles/additional/random_npc_conversation",
    );
    expect(
      await screen.findByRole(
        "heading",
        { name: "Random NPC Conversation", level: 2 },
        LOAD,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Hidden in your list\. Starsmith is turned off/),
    ).toBeInTheDocument();
  });
});
