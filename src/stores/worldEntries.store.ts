import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import {
  EditPermissions,
  ReadPermissions,
  WorldPermission,
  isGuideEquivalent,
} from "repositories/shared.types";

import {
  IWorldEntry,
  IWorldEntryNotesContent,
  WorldEntriesService,
} from "services/worldEntries.service";
import {
  IWorldEntryFieldValue,
  WorldEntryFieldValuesService,
  WorldFieldValue,
} from "services/worldEntryFieldValues.service";

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
  // Values are scoped to the entry currently open, keyed by field definition
  // id. Subscribing per world would stream every field of every entry.
  fieldValueState: {
    entryId: string | null;
    values: Record<string, IWorldEntryFieldValue>;
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
  listenToWorldEntryFieldValues: (entryId: string) => () => void;

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

  setFieldValue: (
    entryId: string,
    worldId: string,
    fieldDefinitionId: string,
    value: WorldFieldValue | null,
  ) => Promise<void>;
  setFieldContent: (
    entryId: string,
    worldId: string,
    fieldDefinitionId: string,
    content: Uint8Array,
  ) => Promise<void>;
  getFieldContent: (
    entryId: string,
    fieldDefinitionId: string,
  ) => Promise<{ content: Uint8Array }>;
  deleteFieldValue: (
    entryId: string,
    fieldDefinitionId: string,
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
  fieldValueState: {
    entryId: null,
    values: {},
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

    listenToWorldEntryFieldValues: (entryId) => {
      set((store) => {
        store.fieldValueState = {
          entryId,
          values: {},
          loading: true,
        };
      });

      return WorldEntryFieldValuesService.listenToWorldEntryFieldValues(
        entryId,
        (changedValues, removedFieldDefinitionIds, replaceState) => {
          set((store) => {
            // A late payload from the previous entry must not leak into the
            // one now open.
            if (store.fieldValueState.entryId !== entryId) return;
            if (replaceState) {
              store.fieldValueState.values = changedValues;
            } else {
              store.fieldValueState.values = {
                ...store.fieldValueState.values,
                ...changedValues,
              };
              removedFieldDefinitionIds.forEach((definitionId) => {
                delete store.fieldValueState.values[definitionId];
              });
            }
            store.fieldValueState.loading = false;
            store.fieldValueState.error = undefined;
          });
        },
        (error) => {
          set((store) => {
            if (store.fieldValueState.entryId !== entryId) return;
            store.fieldValueState.loading = false;
            store.fieldValueState.error = error.message;
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

    setFieldValue: (entryId, worldId, fieldDefinitionId, value) => {
      return WorldEntryFieldValuesService.setWorldEntryFieldValue(
        entryId,
        worldId,
        fieldDefinitionId,
        value,
      );
    },
    setFieldContent: (entryId, worldId, fieldDefinitionId, content) => {
      return WorldEntryFieldValuesService.setWorldEntryFieldContent(
        entryId,
        worldId,
        fieldDefinitionId,
        content,
      );
    },
    getFieldContent: (entryId, fieldDefinitionId) => {
      return WorldEntryFieldValuesService.getWorldEntryFieldContent(
        entryId,
        fieldDefinitionId,
      );
    },
    deleteFieldValue: (entryId, fieldDefinitionId) => {
      return WorldEntryFieldValuesService.deleteWorldEntryFieldValue(
        entryId,
        fieldDefinitionId,
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
  const resetStore = useWorldEntriesStore((store) => store.reset);

  useEffect(() => {
    if (worldId && worldPermission) {
      return listenToWorldEntries(uid, worldId, worldPermission);
    }
  }, [worldId, uid, worldPermission, listenToWorldEntries]);

  useEffect(() => {
    return () => {
      resetStore();
    };
  }, [worldId, resetStore]);
}

// Field values load for one entry at a time; call this from the entry detail
// view. RLS omits gmOnly rows for anyone below guide, so no client-side filter
// is needed here.
export function useListenToWorldEntryFieldValues(entryId: string | undefined) {
  const listenToWorldEntryFieldValues = useWorldEntriesStore(
    (store) => store.listenToWorldEntryFieldValues,
  );

  useEffect(() => {
    if (entryId) {
      return listenToWorldEntryFieldValues(entryId);
    }
  }, [entryId, listenToWorldEntryFieldValues]);
}

// Values for the entry currently subscribed, keyed by field definition id.
// Returns empty for any other entry rather than another entry's values.
export function useWorldEntryFieldValues(
  entryId: string,
): Record<string, IWorldEntryFieldValue> {
  return useWorldEntriesStore((store) =>
    store.fieldValueState.entryId === entryId
      ? store.fieldValueState.values
      : {},
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
