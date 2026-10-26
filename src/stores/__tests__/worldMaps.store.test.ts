import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WorldMapChunk } from "lib/worldMap/chunks";

import { WorldMapsService } from "services/worldMaps.service";

import { getDisplayedChunks, useWorldMapsStore } from "../worldMaps.store";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("notistack", () => ({ enqueueSnackbar: vi.fn() }));
vi.mock("services/analytics.service", () => ({
  AnalyticsService: { logError: vi.fn() },
}));

const store = () => useWorldMapsStore.getState();
const map = () => store().maps.region;

let onChunks: (chunks: WorldMapChunk[], replace: boolean) => void;
let stop: () => void;

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(WorldMapsService, "listenToWorldMap").mockImplementation(
    (_, onMap) => {
      onMap({
        entryId: "region",
        worldId: "world",
        grid: "hex_pointy",
        hexFlowers: false,
        background: null,
      });
      return () => {};
    },
  );
  vi.spyOn(WorldMapsService, "listenToWorldMapChunks").mockImplementation(
    (_, callback) => {
      onChunks = callback;
      return () => {};
    },
  );
  vi.spyOn(WorldMapsService, "listenToWorldMapPins").mockReturnValue(() => {});
  stop = store().listenToWorldMap("region");
});

afterEach(() => {
  stop();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const chunk = (
  cells: WorldMapChunk["cells"],
  version: number,
): WorldMapChunk => ({ x: 0, y: 0, cells, version });

describe("world map painting", () => {
  it("shows paint at once and saves it after a pause", async () => {
    const paint = vi
      .spyOn(WorldMapsService, "paintCells")
      .mockResolvedValue([chunk({ "0,0": { c: "grass" } }, 2)]);
    store().paint("region", { "0,0": { c: "grass" } });
    expect(getDisplayedChunks(map())[0].cells).toEqual({
      "0,0": { c: "grass" },
    });
    expect(paint).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    expect(paint).toHaveBeenCalledWith("region", { "0,0": { c: "grass" } });
    expect(map().pending).toEqual({});
    expect(map().chunks["0,0"].version).toBe(2);
  });

  it("keeps cells painted again while a save is out", async () => {
    let finish: (chunks: WorldMapChunk[]) => void = () => {};
    const paint = vi
      .spyOn(WorldMapsService, "paintCells")
      .mockImplementationOnce(
        () => new Promise((resolve) => (finish = resolve)),
      )
      .mockResolvedValue([chunk({ "0,0": { c: "water" } }, 3)]);
    store().paint("region", { "0,0": { c: "grass" } });
    vi.advanceTimersByTime(300);
    store().paint("region", { "0,0": { c: "water" } });
    finish([chunk({ "0,0": { c: "grass" } }, 2)]);
    await vi.advanceTimersByTimeAsync(0);
    expect(map().pending).toEqual({ "0,0": { c: "water" } });
    expect(getDisplayedChunks(map())[0].cells["0,0"]).toEqual({ c: "water" });
    await vi.runAllTimersAsync();
    expect(paint).toHaveBeenLastCalledWith("region", { "0,0": { c: "water" } });
    expect(map().pending).toEqual({});
  });

  it("drops realtime echoes older than the chunk it holds", () => {
    onChunks([chunk({ "0,0": { c: "snow" } }, 3)], false);
    onChunks([chunk({ "0,0": { c: "grass" } }, 2)], false);
    expect(map().chunks["0,0"].cells).toEqual({ "0,0": { c: "snow" } });
  });

  it("puts refused cells back to what is stored", async () => {
    onChunks([chunk({ "0,0": { c: "snow" } }, 3)], true);
    vi.spyOn(WorldMapsService, "paintCells").mockRejectedValue(
      new Error("refused"),
    );
    store().paint("region", { "0,0": null });
    expect(getDisplayedChunks(map())).toEqual([]);
    await expect(store().flush("region")).rejects.toThrow("refused");
    expect(getDisplayedChunks(map())[0].cells).toEqual({
      "0,0": { c: "snow" },
    });
  });

  it("keeps an untouched chunk's object, so drawing can cache it", () => {
    const stored = chunk({ "0,0": { c: "snow" } }, 3);
    onChunks(
      [stored, { ...stored, x: 1, cells: { "16,0": { c: "sand" } } }],
      true,
    );
    store().paint("region", { "16,0": null });
    const shown = getDisplayedChunks(map());
    expect(shown).toHaveLength(1);
    expect(shown[0]).toBe(map().chunks["0,0"]);
  });
});
