import { act, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAppState } from "stores/appState.store";

import { ColorScheme } from "repositories/shared.types";

import { ThemeProvider } from "../ThemeProvider";
import { uiSchemeNames } from "../uiSchemeNames";

const root = document.documentElement;

function preferDark(dark: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: dark && query.includes("prefers-color-scheme: dark"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  act(() => useAppState.getState().setColorScheme(ColorScheme.Default));
  delete root.dataset.theme;
  delete root.dataset.pandaTheme;
  root.style.colorScheme = "";
});

describe("UI theme bridge", () => {
  it("puts MUI's mode and the app's scheme where the library reads them", () => {
    act(() => useAppState.getState().setColorScheme(ColorScheme.Cinder));
    render(<ThemeProvider>page</ThemeProvider>);
    expect(root.dataset.theme).toBe("light");
    expect(root.style.colorScheme).toBe("light");
    expect(root.dataset.pandaTheme).toBe("cinder");
  });

  it("follows MUI into dark mode", async () => {
    preferDark(true);
    render(<ThemeProvider>page</ThemeProvider>);
    await waitFor(() => expect(root.dataset.theme).toBe("dark"));
    expect(root.style.colorScheme).toBe("dark");
  });

  it("follows a scheme change and drops the attribute for Default", () => {
    render(<ThemeProvider>page</ThemeProvider>);
    expect(root.dataset.pandaTheme).toBeUndefined();
    act(() => useAppState.getState().setColorScheme(ColorScheme.Orchid));
    expect(root.dataset.pandaTheme).toBe("orchid");
  });

  it("names a library scheme for every app scheme", () => {
    for (const scheme of Object.values(ColorScheme)) {
      expect(uiSchemeNames[scheme]).toBe(scheme);
    }
  });
});
