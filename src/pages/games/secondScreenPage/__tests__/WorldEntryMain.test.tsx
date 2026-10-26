import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { worldEntry } from "components/worlds/entries/__tests__/fixtures";

import { useGameStore } from "stores/game.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { ReadPermissions } from "repositories/shared.types";

import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";

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
