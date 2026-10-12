import { EditPermissions, ReadPermissions } from "repositories/shared.types";

import type { IWorldEntry } from "services/worldEntries.service";

import { category } from "../../categories/__tests__/fixtures";

export function worldEntry(overrides: Partial<IWorldEntry> = {}): IWorldEntry {
  return {
    id: "entry-1",
    worldId: category.worldId,
    categoryId: category.id,
    parentEntryId: null,
    name: "Hollowmere",
    imageFilename: null,
    icon: null,
    map: null,
    mapBackgroundFilename: null,
    mapSettings: null,
    readPermissions: ReadPermissions.AllPlayers,
    editPermissions: EditPermissions.GuidesAndAuthor,
    authorId: "author",
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}
