import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WorldPlaysetsRepository } from "repositories/worldPlaysets.repository";

import { useWorldRulesetNames } from "../useWorldRulesetNames";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
describe("world card rules", () => {
  it("combines linked games' active rulesets and expansions without duplicate names", async () => {
    vi.spyOn(
      WorldPlaysetsRepository,
      "getLinkedGamePlaysets",
    ).mockResolvedValue([
      {
        rulesets: { classic: true },
        expansions: { classic: { delve: true } },
        playset: {},
      },
      {
        rulesets: { classic: true, starforged: true },
        expansions: { starforged: { sundered_isles: true } },
        playset: {},
      },
    ]);
    const hook = renderHook(() =>
      useWorldRulesetNames("world-1", "world:classic/ironlands"),
    );
    await waitFor(() =>
      expect(hook.result.current?.names).toEqual([
        "Ironsworn",
        "Delve",
        "Starforged",
        "Sundered Isles",
      ]),
    );
  });
  it("uses setting packages for a standalone world and drops previous world metadata immediately", async () => {
    vi.spyOn(WorldPlaysetsRepository, "getLinkedGamePlaysets")
      .mockResolvedValueOnce([])
      .mockReturnValueOnce(new Promise(() => {}));
    const hook = renderHook(
      ({ worldId }) =>
        useWorldRulesetNames(worldId, "world:sundered_isles/sundered_isles"),
      { initialProps: { worldId: "one" } },
    );
    await waitFor(() =>
      expect(hook.result.current?.names).toEqual([
        "Starforged",
        "Sundered Isles",
      ]),
    );
    hook.rerender({ worldId: "two" });
    expect(hook.result.current).toBeUndefined();
  });
});
