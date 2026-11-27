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

// Characterizes the reference page's asset list (migration slice 11): the
// asset types as links, one type's cards at a time, each opening its own
// page, and search across every type.

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

async function findTypes() {
  return within(
    await screen.findByRole("navigation", { name: "Asset types" }, LOAD),
  );
}

describe("Reference assets", () => {
  beforeAll(() => {
    Element.prototype.scrollBy ??= () => {};
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

  it("shows one asset type at a time, picked from links", async () => {
    const user = userEvent.setup();
    await renderAt("/reference/starforged/assets");
    const types = await findTypes();
    expect(
      screen.getByRole("heading", { name: "Assets", level: 2 }),
    ).toBeInTheDocument();
    const first = types.getAllByRole("link")[0];
    expect(first).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("heading", {
        name: first.textContent ?? "",
        level: 3,
      }),
    ).toBeInTheDocument();

    await user.click(types.getByRole("link", { name: "Companion Assets" }));
    expect(
      await screen.findByRole("heading", {
        name: "Companion Assets",
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      (await findTypes()).getByRole("link", { name: "Companion Assets" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("heading", { name: "Protocol Bot" }),
    ).toBeInTheDocument();
  });

  it("opens each asset's own page from its card", async () => {
    const user = userEvent.setup();
    await renderAt("/reference/starforged/assets");
    await user.click(
      (await findTypes()).getByRole("link", { name: "Companion Assets" }),
    );
    const heading = await screen.findByRole(
      "heading",
      { name: "Protocol Bot" },
      LOAD,
    );
    const card = heading.closest("article, .MuiCard-root") as HTMLElement;
    expect(within(card).getByRole("link", { name: "Open" })).toHaveAttribute(
      "href",
      expect.stringContaining("protocol_bot"),
    );
  });

  it("searches every type by name", async () => {
    const user = userEvent.setup();
    await renderAt("/reference/starforged/assets");
    await findTypes();
    await user.type(screen.getByLabelText("Search assets"), "protocol");
    expect(
      await screen.findByRole("heading", { name: "Protocol Bot" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("navigation", { name: "Asset types" }),
      ).not.toBeInTheDocument(),
    );

    await user.type(screen.getByLabelText("Search assets"), "zzzz");
    expect(
      await screen.findByText("Nothing matches your search"),
    ).toBeInTheDocument();
  });
});
