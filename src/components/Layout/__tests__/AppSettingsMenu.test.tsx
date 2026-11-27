import { ThemeProvider } from "@mui/material";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTheme } from "providers/ThemeProvider/themes/themeConfig";

import {
  AppSettingsContribution,
  useAppSettingsMenuStore,
} from "stores/appSettingsMenu.store";

import { ColorScheme } from "repositories/shared.types";

import { AppSettingsMenu } from "../AppSettingsMenu";

// Characterization tests for the app's settings menu (slice 5).

const auth = vi.hoisted(() => ({ status: 2, signOut: vi.fn() }));
const admin = vi.hoisted(() => ({ isAdmin: false, getMagicLink: vi.fn() }));

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/auth.store", () => ({
  AuthStatus: { Loading: 0, Unauthenticated: 1, Authenticated: 2 },
  useAuthStatus: () => auth.status,
  useAuthStore: (selector: (store: typeof auth) => unknown) => selector(auth),
}));
vi.mock("stores/admin.store", () => ({
  useAdminStore: (selector: (store: typeof admin) => unknown) =>
    selector(admin),
}));

function renderMenu() {
  return render(
    <ThemeProvider theme={getTheme(ColorScheme.Default)}>
      <MemoryRouter>
        <AppSettingsMenu />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

async function openMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Settings" }));
  return { user, menu: await screen.findByRole("menu") };
}

function contribute(contribution: Partial<AppSettingsContribution> = {}) {
  const full: AppSettingsContribution = {
    game: { name: "The Forsaken", isGuide: true },
    onSelect: vi.fn(),
    ...contribution,
  };
  act(() => useAppSettingsMenuStore.getState().setContribution(full));
  return full;
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.status = 2;
  admin.isAdmin = false;
  useAppSettingsMenuStore.setState({ contribution: null });
});

describe("AppSettingsMenu", () => {
  it("offers the app's settings and Sign Out", async () => {
    renderMenu();
    const { menu } = await openMenu();
    for (const name of [
      "Accessibility Settings",
      "Advanced Features",
      "Sign Out",
    ]) {
      expect(within(menu).getByRole("menuitem", { name })).toBeInTheDocument();
    }
    expect(
      within(menu).queryByRole("menuitem", { name: "Admin Settings" }),
    ).toBeNull();
  });

  it("leaves Sign Out out for signed out people", async () => {
    auth.status = 1;
    renderMenu();
    const { menu } = await openMenu();
    expect(
      within(menu).queryByRole("menuitem", { name: "Sign Out" }),
    ).toBeNull();
  });

  it("offers admins Admin Settings", async () => {
    admin.isAdmin = true;
    renderMenu();
    const { user, menu } = await openMenu();
    await user.click(
      within(menu).getByRole("menuitem", { name: "Admin Settings" }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Get Magic Link" }),
    ).toBeInTheDocument();
  });

  it("opens the accessibility settings", async () => {
    renderMenu();
    const { user, menu } = await openMenu();
    await user.click(
      within(menu).getByRole("menuitem", { name: "Accessibility Settings" }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Accessibility Settings" }),
    ).toBeInTheDocument();
  });

  it("opens the advanced features", async () => {
    renderMenu();
    const { user, menu } = await openMenu();
    await user.click(
      within(menu).getByRole("menuitem", { name: "Advanced Features" }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Advanced Features" }),
    ).toBeInTheDocument();
  });

  it("signs out", async () => {
    auth.signOut.mockReturnValue(new Promise(() => {}));
    renderMenu();
    const { user, menu } = await openMenu();
    await user.click(within(menu).getByRole("menuitem", { name: "Sign Out" }));
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("opens the app theme from Change Theme outside a game", async () => {
    renderMenu();
    const { user, menu } = await openMenu();
    await user.click(
      within(menu).getByRole("menuitem", { name: /Change Theme/ }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Everywhere");
  });

  it("adds the game page's sections and hands their items back", async () => {
    const contribution = contribute({
      character: { name: "Kira", isOwner: true },
    });
    renderMenu();
    const { user, menu } = await openMenu();
    expect(
      within(menu).getByRole("group", { name: "Kira" + " Settings" }),
    ).toBeInTheDocument();
    await user.click(
      within(menu).getByRole("menuitem", { name: /Edit Game Name/ }),
    );
    expect(contribution.onSelect).toHaveBeenCalledWith("gameName");
  });

  it("hands Change Theme to the game page", async () => {
    const contribution = contribute({});
    renderMenu();
    const { user, menu } = await openMenu();
    await user.click(
      within(menu).getByRole("menuitem", { name: /Change Theme/ }),
    );
    expect(contribution.onSelect).toHaveBeenCalledWith("theme");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("toggles the game's log sound", async () => {
    const onLogSoundChange = vi.fn();
    contribute({
      game: { name: "The Forsaken", isGuide: false },
      logSound: false,
      onLogSoundChange,
    });
    renderMenu();
    const { user } = await openMenu();
    await user.click(screen.getByText("Sound on New Log Messages"));
    expect(onLogSoundChange).toHaveBeenCalledWith(true);
  });

  it("deletes the game after its confirm", async () => {
    const onDeleteGame = vi.fn();
    contribute({ onDeleteGame });
    renderMenu();
    const { user, menu } = await openMenu();
    await user.click(
      within(menu).getByRole("menuitem", { name: /Delete Game/ }),
    );
    const confirm = await screen.findByRole("alertdialog");
    await user.click(
      within(confirm).getByRole("button", { name: "Delete Game" }),
    );
    expect(onDeleteGame).toHaveBeenCalledTimes(1);
  });

  it("drops the game's sections when the page leaves", async () => {
    const contribution = contribute();
    act(() =>
      useAppSettingsMenuStore.getState().clearContribution(contribution),
    );
    renderMenu();
    const { menu } = await openMenu();
    expect(
      within(menu).queryByRole("menuitem", { name: /Edit Game Name/ }),
    ).toBeNull();
  });
});
