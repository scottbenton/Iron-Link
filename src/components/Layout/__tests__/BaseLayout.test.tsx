import { ThemeProvider } from "@mui/material";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTheme } from "providers/ThemeProvider/themes/themeConfig";

import { ColorScheme } from "repositories/shared.types";

import { BaseLayout } from "../BaseLayout";
import { DefaultLayout } from "../DefaultLayout";

// Characterization tests for the app shell (slice 5): what the frame around
// every page offers, whatever draws it.

const auth = vi.hoisted(() => ({
  status: 2,
  uid: "user-1" as string | undefined,
  signOut: vi.fn(),
}));
const users = vi.hoisted(() => ({
  name: "Scott" as string | null,
  setUserName: vi.fn(),
}));

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({
  AuthStatus: { Loading: 0, Unauthenticated: 1, Authenticated: 2 },
  useAuthStatus: () => auth.status,
  useUID: () => auth.uid,
  useAuthStore: (selector: (store: typeof auth) => unknown) => selector(auth),
}));
vi.mock("stores/users.store", () => ({
  useUserNameWithStatus: () => ({ name: users.name, loading: false }),
  useUsersStore: (selector: (store: typeof users) => unknown) =>
    selector(users),
}));
vi.mock("stores/admin.store", () => ({
  useAdminStore: (selector: (store: { isAdmin: boolean }) => unknown) =>
    selector({ isAdmin: false }),
}));
vi.mock("components/characters/rolls/RollSnackbarSection", () => ({
  RollSnackbarSection: () => null,
}));
vi.mock("components/datasworn/DataswornDialog", () => ({
  DataswornDialog: () => null,
}));

function renderShell(path: string) {
  return render(
    // The MUI theme stays until every screen has moved over.
    <ThemeProvider theme={getTheme(ColorScheme.Default)}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<BaseLayout />}>
            <Route element={<DefaultLayout />}>
              <Route path="/games" element={<h1>Your Games</h1>} />
              <Route path="/reference/*" element={<h1>Reference</h1>} />
              <Route path="/auth" element={<h1>Sign In</h1>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

function getMainNav() {
  // The rail's links; a phone's menu holds the same ones in a drawer. CSS
  // decides which shows, and jsdom applies no media or container queries,
  // so hidden elements count.
  return screen.getAllByRole("navigation", { name: "Main", hidden: true })[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.status = 2;
  auth.uid = "user-1";
  users.name = "Scott";
});

describe("app shell", () => {
  it("shows a loading bar until auth settles", () => {
    auth.status = 0;
    renderShell("/games");
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  it("links signed in people to the app's sections", () => {
    renderShell("/games");
    const nav = getMainNav();
    const links = within(nav).getAllByRole("link", { hidden: true });
    expect(
      links.map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual(
      expect.arrayContaining([
        ["Games", "/games"],
        ["Worlds", "/worlds"],
        ["Homebrew", "/homebrew"],
        ["Reference", "/reference"],
      ]),
    );
    expect(
      within(nav).queryByRole("link", { name: "Sign In/Up", hidden: true }),
    ).toBeNull();
  });

  it("links signed out people to sign in and the reference", () => {
    auth.status = 1;
    auth.uid = undefined;
    renderShell("/reference");
    const nav = getMainNav();
    expect(
      within(nav).getByRole("link", { name: "Sign In/Up", hidden: true }),
    ).toHaveAttribute("href", "/auth");
    expect(
      within(nav).getByRole("link", { name: "Reference", hidden: true }),
    ).toHaveAttribute("href", "/reference");
    expect(
      within(nav).queryByRole("link", { name: "Games", hidden: true }),
    ).toBeNull();
  });

  it("renders the page inside main, after a skip link to it", () => {
    renderShell("/games");
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(
      within(main).getByRole("heading", { level: 1, name: "Your Games" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Skip to Content" }),
    ).toHaveAttribute("href", "#main-content");
  });

  it("sends signed out people on private pages to sign in", () => {
    auth.status = 1;
    auth.uid = undefined;
    renderShell("/games");
    expect(
      screen.getByRole("heading", { level: 1, name: "Sign In" }),
    ).toBeInTheDocument();
  });

  it("asks a signed in person with no name for one", async () => {
    const user = userEvent.setup();
    users.name = null;
    users.setUserName.mockResolvedValue(undefined);
    renderShell("/games");

    const dialog = await screen.findByRole("dialog", { name: "Set your name" });
    const save = within(dialog).getByRole("button", { name: "Save" });
    expect(save).toBeDisabled();

    await user.type(
      within(dialog).getByRole("textbox", { name: "Name" }),
      "  Kai  {Enter}",
    );
    expect(users.setUserName).toHaveBeenCalledWith("user-1", "Kai");
  });
});
