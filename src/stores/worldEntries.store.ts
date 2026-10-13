import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { isValidWorldEntryParent } from "lib/worldEntryParents";

import {
  ErrorNoun,
  ErrorReason,
  ErrorVerb,
  createRepositoryError,
} from "repositories/errors/RepositoryErrors";
import {
  EditPermissions,
  ReadPermissions,
  WorldPermission,
  isGuideEquivalent,
} from "repositories/shared.types";

import {
  IWorldEntry,
  IWorldEntryNotesContent,
  IWorldEntryUpdate,
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
  // Every value in the world, keyed by entry id then field definition id.
  // Rich text content is not held here; it is fetched on demand.
  fieldValueState: {
    // The world being listened to; results for any other world are dropped.
    worldId: string | null;
    valuesByEntry: Record<string, Record<string, IWorldEntryFieldValue>>;
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
  listenToWorldFieldValues: (worldId: string) => () => void;

  createEntry: (
    uid: string,
    worldId: string,
    categoryId: string,
    name: string,
    readPermissions: ReadPermissions,
    editPermissions: EditPermissions,
    parentEntryId?: string,
  ) => Promise<string>;
  updateEntry: (entryId: string, entry: IWorldEntryUpdate) => Promise<void>;
  // Rejects without a request when the loaded entries already show the move
  // is invalid; the database checks every move regardless.
  setEntryParent: (
    entryId: string,
    parentEntryId: string | null,
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
    worldId: null,
    valuesByEntry: {},
    loading: true,
  },
};

export const useWorldEntriesStore = createWithEqualityFn<
  WorldEntriesStoreState & WorldEntriesStoreActions
>()(
  immer((set, get) => ({
    ...defaultWorldEntriesState,

    listenToWorldEntries: (uid, worldId, permission) => {
      return WorldEntriesService.listenToWorldEntries(
        uid,
        worldId,
        permission,
        (changedEntries, removedEntryIds, replaceState) => {
          // An entry that appears outside a snapshot may be one that just
          // became readable, whose existing values send no realtime events.
          const revealedEntryIds = replaceState
            ? []
            : Object.keys(changedEntries).filter(
                (entryId) => !get().entryState.entries[entryId],
              );

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
                // Losing read access to an entry sends no value events, so
                // its values are dropped here rather than awaited.
                delete store.fieldValueState.valuesByEntry[entryId];
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

          revealedEntryIds.forEach((entryId) => {
            const isCurrent = () =>
              get().fieldValueState.worldId === worldId &&
              !!get().entryState.entries[entryId];
            WorldEntryFieldValuesService.getWorldEntryFieldValues(entryId)
              .then((values) => {
                if (!isCurrent()) return;
                set((store) => {
                  const entryValues = (store.fieldValueState.valuesByEntry[
                    entryId
                  ] ??= {});
                  // Realtime events received during the read are newer, so
                  // the read only fills fields they have not set.
                  values.forEach((value) => {
                    entryValues[value.fieldDefinitionId] ??= value;
                  });
                  if (Object.keys(entryValues).length === 0) {
                    delete store.fieldValueState.valuesByEntry[entryId];
                  }
                });
              })
              .catch((error) => {
                if (!isCurrent()) return;
                set((store) => {
                  store.fieldValueState.error = error.message;
                });
              });
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

    listenToWorldFieldValues: (worldId) => {
      set((store) => {
        if (store.fieldValueState.worldId !== worldId) {
          store.fieldValueState = {
            worldId,
            valuesByEntry: {},
            loading: true,
          };
        }
      });

      return WorldEntryFieldValuesService.listenToWorldFieldValues(
        worldId,
        (changedValues, removedValues, replaceState) => {
          set((store) => {
            // A late read from a previous world must not land in this one.
            if (store.fieldValueState.worldId !== worldId) return;
            if (replaceState) {
              store.fieldValueState.valuesByEntry = {};
            }
            const valuesByEntry = store.fieldValueState.valuesByEntry;
            changedValues.forEach((value) => {
              valuesByEntry[value.entryId] ??= {};
              valuesByEntry[value.entryId][value.fieldDefinitionId] = value;
            });
            removedValues.forEach(({ entryId, fieldDefinitionId }) => {
              const entryValues = valuesByEntry[entryId];
              if (!entryValues) return;
              delete entryValues[fieldDefinitionId];
              if (Object.keys(entryValues).length === 0) {
                delete valuesByEntry[entryId];
              }
            });
            store.fieldValueState.loading = false;
            store.fieldValueState.error = undefined;
          });
        },
        (error) => {
          set((store) => {
            if (store.fieldValueState.worldId !== worldId) return;
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
    setEntryParent: (entryId, parentEntryId) => {
      if (
        !isValidWorldEntryParent(
          get().entryState.entries,
          entryId,
          parentEntryId,
        )
      ) {
        return Promise.reject(
          createRepositoryError(
            ErrorReason.InvalidParent,
            ErrorVerb.Update,
            ErrorNoun.WorldEntry,
            false,
          ),
        );
      }
      return WorldEntriesService.setWorldEntryParent(entryId, parentEntryId);
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

// Values start and stop with entries so every view of the entries can read
// their fields too. Mount it with the world and configuration subscriptions
// (at game open or on the standalone world page), so moving between world
// views never reloads entries; views read the store instead.
export function useListenToWorldEntries(worldId: string | undefined) {
  const uid = useUID();
  const worldPermission = useWorldStore((store) => store.worldPermission);

  const listenToWorldEntries = useWorldEntriesStore(
    (store) => store.listenToWorldEntries,
  );
  const listenToWorldFieldValues = useWorldEntriesStore(
    (store) => store.listenToWorldFieldValues,
  );
  const resetStore = useWorldEntriesStore((store) => store.reset);

  useEffect(() => {
    if (worldId && worldPermission) {
      // Restarted on permission changes too: RLS decides which values (gm_only
      // ones especially) the snapshot returns.
      const unsubscribeEntries = listenToWorldEntries(
        uid,
        worldId,
        worldPermission,
      );
      const unsubscribeValues = listenToWorldFieldValues(worldId);
      return () => {
        unsubscribeEntries();
        unsubscribeValues();
      };
    }
  }, [
    worldId,
    uid,
    worldPermission,
    listenToWorldEntries,
    listenToWorldFieldValues,
  ]);

  // Only the owner resets the store; see useListenToWorldConfiguration.
  useEffect(() => {
    if (!worldId) return;
    return () => {
      resetStore();
    };
  }, [worldId, resetStore]);
}

const NO_FIELD_VALUES: Record<string, IWorldEntryFieldValue> = {};

// One entry's values, keyed by field definition id.
export function useWorldEntryFieldValues(
  entryId: string,
): Record<string, IWorldEntryFieldValue> {
  return useWorldEntriesStore(
    (store) => store.fieldValueState.valuesByEntry[entryId] ?? NO_FIELD_VALUES,
  );
}

// Every entry's values, keyed by entry id then field definition id.
export function useWorldFieldValuesByEntry(): Record<
  string,
  Record<string, IWorldEntryFieldValue>
> {
  return useWorldEntriesStore((store) => store.fieldValueState.valuesByEntry);
}

// Mirrors the world_entries update/delete policies: explicit viewers are
// read-only, guides/editors/owners can always delete, and edit access follows
// the entry's edit_permissions.
export function getEntryPermissions(
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
    // Permissions are columns of the entry, so changing them is an update the
    // database allows only under the current edit permissions.
    canChangePermissions: canEdit && (isAuthor || isGuide),
  };
}
