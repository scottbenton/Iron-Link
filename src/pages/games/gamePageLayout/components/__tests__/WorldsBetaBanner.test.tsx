import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAdvancedFeatureToggles } from "hooks/advancedFeatures/advancedFeatures";
import {
  useShowWorldsBetaBanner,
  useWorldsBetaBannerDismissals,
} from "hooks/advancedFeatures/worldsBetaBanner";

import { WorldsBetaBanner } from "../WorldsBetaBanner";

const game = vi.hoisted(() => ({ worldId: "world-a" as string | null }));
vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("stores/game.store", () => ({
  GamePermission: { Guide: "guide" },
  useGameStore: (select: (value: unknown) => unknown) =>
    select({ game: { worldId: game.worldId }, gamePermissions: "player" }),
}));

function setWorldsEnabled(value: boolean) {
  act(() => useAdvancedFeatureToggles.getState().updateToggle("worlds", value));
}

describe("WorldsBetaBanner", () => {
  beforeEach(() => {
    game.worldId = "world-a";
    setWorldsEnabled(false);
    useWorldsBetaBannerDismissals.setState({ dismissedGameIds: [] });
  });
  afterEach(() => localStorage.clear());

  it("shows only for a game with a world while the beta is off", () => {
    const { result, rerender } = renderHook(() =>
      useShowWorldsBetaBanner("game-a"),
    );
    expect(result.current).toBe(true);

    setWorldsEnabled(true);
    rerender();
    expect(result.current).toBe(false);

    setWorldsEnabled(false);
    game.worldId = null;
    rerender();
    expect(result.current).toBe(false);
  });

  it("turns the beta on from its button", async () => {
    render(<WorldsBetaBanner gameId="game-a" />);
    await userEvent.click(
      screen.getByRole("button", { name: "Turn on the beta" }),
    );
    expect(useAdvancedFeatureToggles.getState().toggles.worlds).toBe(true);
  });

  it("stays dismissed for that game only", async () => {
    render(<WorldsBetaBanner gameId="game-a" />);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(
      renderHook(() => useShowWorldsBetaBanner("game-a")).result.current,
    ).toBe(false);
    expect(
      renderHook(() => useShowWorldsBetaBanner("game-b")).result.current,
    ).toBe(true);
    expect(useAdvancedFeatureToggles.getState().toggles.worlds).toBe(false);
  });
});
