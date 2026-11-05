import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { useFocusPageOnNavigate } from "../useFocusPageOnNavigate";

function Layout(props: { children: React.ReactNode }) {
  useFocusPageOnNavigate("main");
  return (
    <>
      <nav>
        <Link to="/games">Games</Link>
        <Link to="/worlds">Worlds</Link>
      </nav>
      <main id="main" tabIndex={-1}>
        {props.children}
      </main>
    </>
  );
}

function LoadingPage() {
  const [loaded, setLoaded] = useState(false);
  return loaded ? (
    <h1>Ironlands</h1>
  ) : (
    <button onClick={() => setLoaded(true)}>Finish loading</button>
  );
}

function renderApp(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Layout>
        <Routes>
          <Route path="/games" element={<h1>Your Games</h1>} />
          <Route
            path="/games/:id/*"
            element={
              <>
                <h1>Game</h1>
                <Link to="/games/abc/c/kai">Kai</Link>
              </>
            }
          />
          <Route path="/worlds" element={<LoadingPage />} />
        </Routes>
      </Layout>
    </MemoryRouter>,
  );
}

describe("useFocusPageOnNavigate", () => {
  it("leaves focus alone on the first load", () => {
    renderApp("/games");
    expect(document.activeElement).toBe(document.body);
  });

  it("moves focus to the new page's h1", async () => {
    const user = userEvent.setup();
    renderApp("/worlds");
    await user.click(screen.getByRole("link", { name: "Games" }));
    expect(screen.getByRole("heading", { name: "Your Games" })).toHaveFocus();
  });

  it("focuses main until the h1 renders, then the h1", async () => {
    const user = userEvent.setup();
    renderApp("/games");
    await user.click(screen.getByRole("link", { name: "Worlds" }));
    expect(screen.getByRole("main")).toHaveFocus();

    act(() => screen.getByRole("button", { name: "Finish loading" }).click());
    // The MutationObserver callback runs as a microtask.
    await act(async () => {});
    expect(screen.getByRole("heading", { name: "Ironlands" })).toHaveFocus();
  });

  it("keeps focus on a control that stays within the same page", async () => {
    const user = userEvent.setup();
    renderApp("/games/abc");
    const link = screen.getByRole("link", { name: "Kai" });
    await user.click(link);
    expect(link).toHaveFocus();
  });
});
