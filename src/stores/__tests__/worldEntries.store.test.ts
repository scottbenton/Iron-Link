import { enqueueSnackbar } from "notistack";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorReason } from "repositories/errors/RepositoryErrors";
import {
  EditPermissions,
  ReadPermissions,
  WorldPermission,
} from "repositories/shared.types";

import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";

import {
  getEntryPermissions,
  useWorldEntriesStore,
} from "../worldEntries.store";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("notistack", () => ({ enqueueSnackbar: vi.fn() }));
vi.mock("services/analytics.service", () => ({
  AnalyticsService: { logError: vi.fn() },
}));

const entry = (id: string, parentEntryId: string | null): IWorldEntry => ({
  id,
  worldId: "world",
  categoryId: "locations",
  parentEntryId,
  name: id,
  imageFilename: null,
  icon: null,
  map: null,
  mapBackgroundFilename: null,
  mapSettings: null,
  readPermissions: ReadPermissions.AllPlayers,
  editPermissions: EditPermissions.AllPlayers,
  authorId: "author",
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

const store = () => useWorldEntriesStore.getState();
let setParent: ReturnType<typeof vi.fn>;

beforeEach(() => {
  setParent = vi.fn().mockResolvedValue(undefined);
  vi.spyOn(WorldEntriesService, "setWorldEntryParent").mockImplementation(
    setParent,
  );
  useWorldEntriesStore.setState((state) => {
    state.entryState.entries = {
      region: entry("region", null),
      area: entry("area", "region"),
    };
  });
});

afterEach(() => {
  store().reset();
  vi.restoreAllMocks();
  vi.mocked(enqueueSnackbar).mockClear();
});

describe("world entry parents", () => {
  it("sends valid moves to the server", async () => {
    await store().setEntryParent("region", null);
    await store().setEntryParent("area", "region");
    expect(setParent).toHaveBeenCalledTimes(2);
    expect(setParent).toHaveBeenLastCalledWith("area", "region");
  });

  it("refuses a move inside a descendant without a request", async () => {
    await expect(
      store().setEntryParent("region", "area"),
    ).rejects.toMatchObject({ reason: ErrorReason.InvalidParent });
    expect(setParent).not.toHaveBeenCalled();
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      "That entry can't be placed there. Choose an entry in the same category that isn't the entry itself or one of its nested entries.",
      { variant: "error" },
    );
  });
});

describe("world entry permissions", () => {
  it("lets the author and Guides change permissions only while they can edit", () => {
    expect(
      getEntryPermissions(
        EditPermissions.OnlyAuthor,
        "author",
        "guide",
        WorldPermission.Guide,
      ),
    ).toEqual({ canEdit: false, canDelete: true, canChangePermissions: false });
    expect(
      getEntryPermissions(
        EditPermissions.OnlyGuides,
        "author",
        "author",
        WorldPermission.Player,
      ),
    ).toEqual({ canEdit: false, canDelete: true, canChangePermissions: false });
    expect(
      getEntryPermissions(
        EditPermissions.GuidesAndAuthor,
        "author",
        "guide",
        WorldPermission.Guide,
      ),
    ).toEqual({ canEdit: true, canDelete: true, canChangePermissions: true });
    expect(
      getEntryPermissions(
        EditPermissions.OnlyAuthor,
        "author",
        "author",
        WorldPermission.Player,
      ),
    ).toEqual({ canEdit: true, canDelete: true, canChangePermissions: true });
  });

  it("never lets other players change permissions, even when they can edit", () => {
    expect(
      getEntryPermissions(
        EditPermissions.AllPlayers,
        "author",
        "player",
        WorldPermission.Player,
      ),
    ).toEqual({ canEdit: true, canDelete: false, canChangePermissions: false });
  });
});
