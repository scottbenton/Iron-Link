import { afterEach, describe, expect, it, vi } from "vitest";

// The toggle store imports the game store, which pulls in the Supabase client.
// Re-importing it per test would otherwise create a new client every time.
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

const STORAGE_KEY = "iron-link-advanced-feature-toggles";

async function loadToggles() {
  vi.resetModules();
  const { useAdvancedFeatureToggles } = await import("../advancedFeatures");
  return useAdvancedFeatureToggles.getState().toggles;
}

describe("useAdvancedFeatureToggles persistence", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("defaults every feature to disabled", async () => {
    expect(await loadToggles()).toEqual({
      secondScreen: false,
      worlds: false,
    });
  });

  it("fills in features missing from older persisted toggles", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { toggles: { secondScreen: true } },
        version: 0,
      }),
    );
    expect(await loadToggles()).toEqual({
      secondScreen: true,
      worlds: false,
    });
  });

  it("keeps persisted values for known features", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { toggles: { worlds: true } },
        version: 0,
      }),
    );
    expect(await loadToggles()).toEqual({
      secondScreen: false,
      worlds: true,
    });
  });

  it("drops toggles for features that no longer exist", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { toggles: { worlds: true, socialLogin: true } },
        version: 0,
      }),
    );
    expect(await loadToggles()).toEqual({
      secondScreen: false,
      worlds: true,
    });
  });

  it("ignores non-boolean persisted values", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: { toggles: { worlds: "yes" } },
        version: 0,
      }),
    );
    expect(await loadToggles()).toEqual({
      secondScreen: false,
      worlds: false,
    });
  });
});
