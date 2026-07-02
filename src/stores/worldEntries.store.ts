import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import {
  EditPermissions,
  ReadPermissions,
  WorldPermission,
} from "repositories/shared.types";

import {
  IWorldEntry,
  IWorldEntryNotesContent,
  WorldEntriesService,
} from "services/worldEntries.service";
import {
  IWorldEntryGmData,
  WorldEntryGmDataService,
} from "services/worldEntryGmData.service";

import { useUID } from "./auth.store";
import { useWorldStore } from "./world.store";

interface EntryPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canChangePermissions: boolean;
}

interface WorldEntriesStoreState {
  entryState: {
    entries: Record<string, IWorldEntry>;
    permissions: Record<string, EntryPermissions>;
    loading: boolean;
    error?: string;
  };
  gmDataState: {
    gmData: Record<string, IWorldEntryGmData>;
    loading: boolean;
    error?: string;
  };
}

interface WorldEntriesStoreActions {
  listenToWorldEntries: (
    uid: string | undefined,
    worldId: string,
    permission: WorldPermission,
  ) => () => void;
  listenToWorldEntryGmData: (worldId: string) => () => void;

  createEntry: (
    uid: string,
    worldId: string,
    categoryId: string,
    name: string,
    readPermissions: ReadPermissions,
    editPermissions: EditPermissions,
    parentEntryId?: string,
  ) => Promise<string>;
  updateEntry: (
    entryId: string,
    entry: Partial<
      Omit<
        IWorldEntry,
        "id" | "worldId" | "authorId" | "createdAt" | "updatedAt"
      >
    >,
  ) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;

  getEntryNotesContent: (entryId: string) => Promise<IWorldEntryNotesContent>;
  updateEntryNotesContent: (
    entryId: string,
    content: Uint8Array,
  ) => Promise<void>;

  updateEntryGmFields: (
    entryId: string,
    worldId: string,
    fields: IWorldEntryGmData["fields"],
  ) => Promise<void>;
  getEntryGmNotesContent: (entryId: string) => Promise<{ content: Uint8Array }>;
  updateEntryGmNotesContent: (
    entryId: string,
    worldId: string,
    content: Uint8Array,
  ) => Promise<void>;

  uploadEntryImage: (
    worldId: string,
    entryId: string,
    image: File,
  ) => Promise<{ filename: string; url: string }>;
  deleteEntryImage: (
    worldId: string,
    entryId: string,
    filename: string,
  ) => Promise<void>;

  reset: () => void;
}

const defaultWorldEntriesState: WorldEntriesStoreState = {
  entryState: {
    entries: {},
    permissions: {},
    loading: true,
  },
  gmDataState: {
    gmData: {},
    loading: true,
  },
};

export const useWorldEntriesStore = createWithEqualityFn<
  WorldEntriesStoreState & WorldEntriesStoreActions
>()(
  immer((set) => ({
    ...defaultWorldEntriesState,

    listenToWorldEntries: (uid, worldId, permission) => {
      return WorldEntriesService.listenToWorldEntries(
        uid,
        worldId,
        permission,
        (changedEntries, removedEntryIds, replaceState) => {
          set((store) => {
            if (replaceState) {
              store.entryState.entries = changedEntries;
              store.entryState.permissions = {};
            } else {
              store.entryState.entries = {
                ...store.entryState.entries,
                ...changedEntries,
              };
              removedEntryIds.forEach((entryId) => {
                delete store.entryState.entries[entryId];
                delete store.entryState.permissions[entryId];
              });
            }
            Object.entries(changedEntries).forEach(([entryId, entry]) => {
              store.entryState.permissions[entryId] = getEntryPermissions(
                entry.editPermissions,
                entry.authorId,
                uid,
                permission,
              );
            });
            store.entryState.loading = false;
            store.entryState.error = undefined;
          });
        },
        (error) => {
          set((store) => {
            store.entryState.loading = false;
            store.entryState.error = error.message;
          });
        },
      );
    },

    listenToWorldEntryGmData: (worldId) => {
      return WorldEntryGmDataService.listenToWorldEntryGmData(
        worldId,
        (changedGmData, removedEntryIds, replaceState) => {
          set((store) => {
            if (replaceState) {
              store.gmDataState.gmData = changedGmData;
            } else {
              store.gmDataState.gmData = {
                ...store.gmDataState.gmData,
                ...changedGmData,
              };
              removedEntryIds.forEach((entryId) => {
                delete store.gmDataState.gmData[entryId];
              });
            }
            store.gmDataState.loading = false;
            store.gmDataState.error = undefined;
          });
        },
        (error) => {
          set((store) => {
            store.gmDataState.loading = false;
            store.gmDataState.error = error.message;
          });
        },
      );
    },

    createEntry: (
      uid,
      worldId,
      categoryId,
      name,
      readPermissions,
      editPermissions,
      parentEntryId,
    ) => {
      return WorldEntriesService.addWorldEntry(
        uid,
        worldId,
        categoryId,
        name,
        readPermissions,
        editPermissions,
        parentEntryId,
      );
    },
    updateEntry: (entryId, entry) => {
      return WorldEntriesService.updateWorldEntry(entryId, entry);
    },
    deleteEntry: (entryId) => {
      return WorldEntriesService.deleteWorldEntry(entryId);
    },

    getEntryNotesContent: (entryId) => {
      return WorldEntriesService.getWorldEntryNotesContent(entryId);
    },
    updateEntryNotesContent: (entryId, content) => {
      return WorldEntriesService.updateWorldEntryNotesContent(entryId, content);
    },

    updateEntryGmFields: (entryId, worldId, fields) => {
      return WorldEntryGmDataService.updateWorldEntryGmFields(
        entryId,
        worldId,
        fields,
      );
    },
    getEntryGmNotesContent: (entryId) => {
      return WorldEntryGmDataService.getWorldEntryGmNotesContent(entryId);
    },
    updateEntryGmNotesContent: (entryId, worldId, content) => {
      return WorldEntryGmDataService.updateWorldEntryGmNotesContent(
        entryId,
        worldId,
        content,
      );
    },

    uploadEntryImage: (worldId, entryId, image) => {
      return WorldEntriesService.uploadWorldEntryImage(worldId, entryId, image);
    },
    deleteEntryImage: (worldId, entryId, filename) => {
      return WorldEntriesService.deleteWorldEntryImage(
        worldId,
        entryId,
        filename,
      );
    },

    reset: () => {
      set((store) => ({ ...store, ...defaultWorldEntriesState }));
    },
  })),
  deepEqual,
);

export function useListenToWorldEntries(worldId: string | undefined) {
  const uid = useUID();
  const worldPermission = useWorldStore((store) => store.worldPermission);

  const listenToWorldEntries = useWorldEntriesStore(
    (store) => store.listenToWorldEntries,
  );
  const listenToWorldEntryGmData = useWorldEntriesStore(
    (store) => store.listenToWorldEntryGmData,
  );
  const resetStore = useWorldEntriesStore((store) => store.reset);

  useEffect(() => {
    if (worldId && worldPermission) {
      return listenToWorldEntries(uid, worldId, worldPermission);
    }
  }, [worldId, uid, worldPermission, listenToWorldEntries]);

  useEffect(() => {
    // RLS limits gm data to owner/editor/guide; don't subscribe for others
    if (worldId && worldPermission && isGuideEquivalent(worldPermission)) {
      return listenToWorldEntryGmData(worldId);
    }
  }, [worldId, worldPermission, listenToWorldEntryGmData]);

  useEffect(() => {
    return () => {
      resetStore();
    };
  }, [worldId, resetStore]);
}

export function isGuideEquivalent(permission: WorldPermission): boolean {
  return (
    permission === WorldPermission.Owner ||
    permission === WorldPermission.Editor ||
    permission === WorldPermission.Guide
  );
}

// Mirrors the world_entries update/delete policies: explicit viewers are
// read-only, guides/editors/owners can always delete, and edit access follows
// the entry's edit_permissions.
function getEntryPermissions(
  editPermissions: EditPermissions,
  authorId: string,
  uid: string | undefined,
  worldPermission: WorldPermission,
): EntryPermissions {
  if (
    !uid ||
    worldPermission === WorldPermission.None ||
    worldPermission === WorldPermission.Viewer
  ) {
    return { canEdit: false, canDelete: false, canChangePermissions: false };
  }

  const isAuthor = authorId === uid;
  const isGuide = isGuideEquivalent(worldPermission);

  let canEdit: boolean;
  switch (editPermissions) {
    case EditPermissions.AllPlayers:
      canEdit = true;
      break;
    case EditPermissions.GuidesAndAuthor:
      canEdit = isAuthor || isGuide;
      break;
    case EditPermissions.OnlyGuides:
      canEdit = isGuide;
      break;
    case EditPermissions.OnlyAuthor:
      canEdit = isAuthor;
      break;
    default:
      canEdit = false;
  }

  return {
    canEdit,
    canDelete: isAuthor || isGuide,
    canChangePermissions: isAuthor || isGuide,
  };
}
