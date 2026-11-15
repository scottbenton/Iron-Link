import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { worldEntry } from "components/worlds/entries/__tests__/fixtures";

import { useGameStore } from "stores/game.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { ReadPermissions } from "repositories/shared.types";

import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";
import { WorldMapsService } from "services/worldMaps.service";

import { WorldEntryMain } from "../WorldEntryMain";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
// The logo needs the app theme, which these tests do not set up.
vi.mock("components/Layout/IronLinkLogo", () => ({ IronLinkLogo: () => null }));
vi.mock("stores/world.store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("stores/world.store")>()),
  useListenToWorld: () => {},
}));
vi.mock("stores/worldCategories.store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("stores/worldCategories.store")>()),
  useListenToWorldConfiguration: () => {},
}));
vi.mock("stores/worldEntries.store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("stores/worldEntries.store")>()),
  useListenToWorldEntries: () => {},
}));

function show(entry: IWorldEntry) {
  useWorldEntriesStore.setState((store) => {
    store.entryState.loading = false;
    store.entryState.entries = { [entry.id]: entry };
  });
  render(<WorldEntryMain worldId={entry.worldId} entryId={entry.id} />);
}

beforeEach(() => {
  useWorldEntriesStore.getState().reset();
  useGameStore.setState((store) => {
    store.game = {
      ...store.game,
      name: "The Game",
      worldId: worldEntry().worldId,
    } as typeof store.game;
  });
  vi.spyOn(WorldEntriesService, "getWorldEntryImageUrl").mockReturnValue(
    "https://example.com/kira.png",
  );
});

describe("WorldEntryMain", () => {
  it("shows an entry's picture with its name, and nothing else", () => {
    show(worldEntry({ name: "Kira Vale", imageFilename: "kira.png" }));
    expect(screen.getByRole("img", { name: "Kira Vale" })).toHaveAttribute(
      "src",
      "https://example.com/kira.png",
    );
    expect(
      screen.getByRole("heading", { name: "Kira Vale" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("shows the name when the entry has no picture", () => {
    show(worldEntry({ name: "Bleakhold" }));
    expect(
      screen.getByRole("heading", { name: "Bleakhold" }),
    ).toBeInTheDocument();
  });

  it("shows the game instead of an entry only Guides can see", () => {
    show(
      worldEntry({
        name: "The Spy",
        readPermissions: ReadPermissions.OnlyGuides,
      }),
    );
    expect(screen.queryByText("The Spy")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "The Game" }),
    ).toBeInTheDocument();
  });
});

describe("WorldEntryMain with a map", () => {
  const region = worldEntry({ id: "region", name: "The Havens" });
  const place = (id: string, name: string, readPermissions: ReadPermissions) =>
    worldEntry({ id, name, parentEntryId: region.id, readPermissions });

  beforeEach(() => {
    // jsdom lays nothing out; the map draws pins only once it has a size.
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(800);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(600);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    vi.spyOn(WorldMapsService, "listenToWorldMap").mockImplementation(
      (entryId, onMap) => {
        onMap({
          entryId,
          worldId: region.worldId,
          grid: "hex_pointy",
          hexFlowers: false,
          background: null,
        });
        return () => {};
      },
    );
    vi.spyOn(WorldMapsService, "listenToWorldMapChunks").mockImplementation(
      (_, onChunks) => {
        onChunks([], true);
        return () => {};
      },
    );
    vi.spyOn(WorldMapsService, "listenToWorldMapPins").mockImplementation(
      (entryId, onPins) => {
        onPins(
          [
            { entryId: "town", mapEntryId: entryId, x: 0, y: 0 },
            { entryId: "lair", mapEntryId: entryId, x: 200, y: 0 },
          ],
          [],
          true,
        );
        return () => {};
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the map with pins for places everyone can read only", async () => {
    useWorldEntriesStore.setState((store) => {
      store.entryState.loading = false;
      store.entryState.entries = {
        region,
        town: place("town", "Highwatch", ReadPermissions.AllPlayers),
        lair: place("lair", "The Hidden Lair", ReadPermissions.OnlyGuides),
      };
    });
    await act(async () => {
      render(
        <WorldEntryMain worldId={region.worldId} entryId={region.id} map />,
      );
    });
    expect(
      screen.getByRole("application", { name: "Map of The Havens" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Highwatch" })).toBeInTheDocument();
    expect(screen.queryByText("The Hidden Lair")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Back to the map" }),
    ).not.toBeInTheDocument();
  });
});
