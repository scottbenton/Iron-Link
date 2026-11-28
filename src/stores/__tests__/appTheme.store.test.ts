import { beforeEach, describe, expect, it, vi } from "vitest";

import { ColorScheme } from "repositories/shared.types";

import { useAppThemeStore } from "../appTheme.store";

const userService = vi.hoisted(() => ({
  getUser: vi.fn(),
  setColorScheme: vi.fn(),
}));

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("services/user.service", () => ({ UserService: userService }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const theme = () => useAppThemeStore.getState().appTheme;

describe("useAppThemeStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppThemeStore.setState({ appTheme: ColorScheme.Cinder });
  });

  it("replaces the device copy with the account's theme", async () => {
    userService.getUser.mockResolvedValue({
      id: "me",
      displayName: null,
      colorScheme: null,
    });
    await useAppThemeStore.getState().loadAppTheme("me");
    expect(theme()).toBeNull();
  });

  it("shows a change at once and saves it on the account", async () => {
    const save = deferred<void>();
    userService.setColorScheme.mockReturnValue(save.promise);

    const saving = useAppThemeStore
      .getState()
      .setAppTheme("me", ColorScheme.Myriad);
    expect(theme()).toBe(ColorScheme.Myriad);
    expect(userService.setColorScheme).toHaveBeenCalledWith(
      "me",
      ColorScheme.Myriad,
    );

    save.resolve();
    await saving;
    expect(theme()).toBe(ColorScheme.Myriad);
  });

  it("puts the previous theme back when the save fails", async () => {
    userService.setColorScheme.mockRejectedValue(new Error("offline"));
    await expect(
      useAppThemeStore.getState().setAppTheme("me", ColorScheme.Myriad),
    ).rejects.toThrow("offline");
    expect(theme()).toBe(ColorScheme.Cinder);
  });

  it("keeps it on the device when signed out", async () => {
    await useAppThemeStore
      .getState()
      .setAppTheme(undefined, ColorScheme.Orchid);
    expect(theme()).toBe(ColorScheme.Orchid);
    expect(userService.setColorScheme).not.toHaveBeenCalled();
  });

  it("never lets a slow load undo a change made while it ran", async () => {
    const load = deferred<{ colorScheme: ColorScheme | null }>();
    userService.getUser.mockReturnValue(load.promise);
    userService.setColorScheme.mockResolvedValue(undefined);

    const loading = useAppThemeStore.getState().loadAppTheme("me");
    await useAppThemeStore.getState().setAppTheme("me", ColorScheme.Myriad);
    load.resolve({ colorScheme: ColorScheme.Gloaming });
    await loading;

    expect(theme()).toBe(ColorScheme.Myriad);
  });
});
