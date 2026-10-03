import { describe, expect, it, vi } from "vitest";

import { WorldsService } from "../worlds.service";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), loadCatalog: vi.fn() }));
vi.mock("lib/supabase.lib", () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock("lib/worldOracleCatalog", () => ({
  loadWorldOracleCatalog: mocks.loadCatalog,
}));

describe("world creation", () => {
  it("creates only a world and membership, with no category seeding or oracle dependency", async () => {
    mocks.rpc.mockResolvedValue({ data: "world-id", error: null, status: 200 });
    expect(
      await WorldsService.createWorld(
        "Ironlands",
        undefined,
        "world:classic/ironlands",
      ),
    ).toBe("world-id");
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("create_world", {
      p_name: "Ironlands",
      p_description: undefined,
      p_setting_key: "world:classic/ironlands",
    });
    expect(mocks.loadCatalog).not.toHaveBeenCalled();
  });
});
