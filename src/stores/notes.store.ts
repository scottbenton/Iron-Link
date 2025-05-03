import deepEqual from "fast-deep-equal";
import { useEffect, useRef } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { createId } from "lib/id.lib";

import { EditPermissions, ReadPermissions } from "repositories/shared.types";

import { INoteFolder, NoteFoldersService } from "services/noteFolders.service";
import { INote, INoteContent, NotesService } from "services/notes.service";

import { useAuthStore, useUID } from "./auth.store";
import { GamePermission } from "./game.store";

interface Permissions {
  canEdit: boolean;
  canDelete: boolean;
  canChangePermissions: boolean;
}

export type IOpenNoteItem = { type: "note" | "folder"; itemId: string };
interface NotesStoreState {
  noteState: {
    notes: Record<string, INote>;
    permissions: Record<string, Permissions>;
    loading: boolean;
    error?: string;
  };
  folderState: {
    folders: Record<string, INoteFolder>;
    permissions: Record<string, Permissions>;
    loading: boolean;
    error?: string;
  };
  noteContentState: Record<
    string,
    { loading: boolean; content?: INoteContent; error?: string }
  >;

  noteTabItems: Record<string, IOpenNoteItem>;
  noteTabOrder: string[];
  openTabItemId: string | null;
}

interface NotesStoreActions {
  listenToGameNoteFolders: (
    uid: string | undefined,
    gameId: string,
    gamePermissions: GamePermission,
  ) => () => void;
  listenToGameNotes: (
    uid: string | undefined,
    gameId: string,
    gamePermissions: GamePermission,
  ) => () => void;
  listenToNoteContent: (noteId: string) => () => void;

  createFolder: (
    uid: string,
    gameId: string,
    parentFolderId: string | null,
    name: string,
    order: number,
    readPermissions: ReadPermissions,
    editPermissions: EditPermissions,
    isRootPlayerFolder?: boolean,
  ) => Promise<string>;
  updateFolderName: (folderId: string, name: string) => Promise<void>;
  moveFolder: (
    folderId: string,
    newParentFolderId: string,
    updatePermissions: boolean,
  ) => Promise<void>;
  updateFolderPermissions: (
    folderId: string,
    readPermissions: ReadPermissions,
    editPermissions: EditPermissions,
  ) => Promise<void>;

  deleteFolder: (folderId: string) => Promise<void>;

  createNote: (
    gameId: string,
    uid: string,
    parentFolderId: string,
    title: string,
    order: number,
  ) => Promise<string>;
  updateNoteName: (noteId: string, title: string) => Promise<void>;
  updateNoteOrder: (noteId: string, order: number) => Promise<void>;
  moveNote: (
    noteId: string,
    newParentFolderId: string,
    updatePermissions: boolean,
  ) => Promise<void>;
  updateNotePermissions: (
    noteId: string,
    readPermissions: ReadPermissions,
    editPermissions: EditPermissions,
  ) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;

  updateNoteContent: (
    noteId: string,
    content: Uint8Array,
    contentString: string,
    isBeaconRequest?: boolean,
  ) => Promise<void>;
  uploadNoteImage: (noteId: string, image: File) => Promise<string>;

  getFolderDescendants: (folderId: string) => {
    folders: Record<string, INoteFolder>;
    notes: Record<string, INote>;
  };

  reset: () => void;

  switchToTab: (tabId: string) => void;
  openItemTab: (params: {
    type: "note" | "folder";
    id: string;
    replacedTabId?: string;
    openInBackground?: boolean;
    disallowDuplicates?: boolean;
  }) => void;
  closeTab: (tabId: string) => void;
  closeTabsMatching: (type: "note" | "folder", id: string) => void;
}

const defaultNotesState: NotesStoreState = {
  noteState: { loading: true, notes: {}, permissions: {}, error: undefined },
  folderState: {
    loading: true,
    permissions: {},
    folders: {},
    error: undefined,
  },
  noteContentState: {},
  noteTabItems: {},
  noteTabOrder: [],
  openTabItemId: null,
};

export const useNotesStore = createWithEqualityFn<
  NotesStoreState & NotesStoreActions
>()(
  immer((set, getState) => ({
    ...defaultNotesState,

    listenToGameNoteFolders: (uid, gameId, gamePermissions) => {
      return NoteFoldersService.listenToGameNoteFolders(
        uid,
        gameId,
        gamePermissions,
        (changedNoteFolders, deletedNoteFolderIds, replaceState) => {
          set((store) => {
            if (replaceState) {
              store.folderState.folders = changedNoteFolders;
              store.folderState.permissions = {};
            } else {
              store.folderState.folders = {
                ...store.folderState.folders,
                ...changedNoteFolders,
              };
              deletedNoteFolderIds.forEach((folderId) => {
                delete store.folderState.folders[folderId];
                delete store.folderState.permissions[folderId];
              });
            }
            Object.entries(changedNoteFolders).forEach(([folderId, folder]) => {
              const permissions = getPermissions(
                folder.editPermissions,
                folder.creator,
                uid,
                gamePermissions,
              );
              store.folderState.permissions[folderId] = permissions;
            });
            store.folderState.loading = false;
            store.folderState.error = undefined;
          });
        },
        (error) => {
          set((store) => {
            store.folderState.loading = false;
            store.folderState.error = error.message;
          });
        },
      );
    },
    listenToGameNotes: (uid, gameId, gamePermissions) => {
      return NotesService.listenToGameNotes(
        uid,
        gameId,
        gamePermissions,
        (changedNotes, removedNoteIds, replaceState) => {
          set((store) => {
            if (replaceState) {
              store.noteState.notes = changedNotes;
              store.noteState.permissions = {};
            } else {
              store.noteState.notes = {
                ...store.noteState.notes,
                ...changedNotes,
              };
              removedNoteIds.forEach((noteId) => {
                delete store.noteState.notes[noteId];
                delete store.noteState.permissions[noteId];
              });
            }

            Object.entries(changedNotes).forEach(([noteId, note]) => {
              const permissions = getPermissions(
                note.editPermissions,
                note.creator,
                uid,
                gamePermissions,
              );
              store.noteState.permissions[noteId] = permissions;
            });

            store.noteState.loading = false;
            store.noteState.error = undefined;
          });
        },
        (error) => {
          set((store) => {
            store.noteState.loading = false;
            store.noteState.error = error.message;
          });
        },
      );
    },
    listenToNoteContent: (noteId) => {
      const noteContent = getState().noteContentState[noteId];
      if (!noteContent) {
        set((store) => {
          store.noteContentState[noteId] = {
            loading: true,
            content: undefined,
            error: undefined,
          };
        });
      }
      return NotesService.listenToNoteContent(
        noteId,
        (noteContent) => {
          set((store) => {
            store.noteContentState[noteId] = {
              content: noteContent,
              loading: false,
              error: undefined,
            };
          });
        },
        (error) => {
          set((store) => {
            store.noteContentState[noteId] = {
              content: undefined,
              loading: false,
              error: error.message,
            };
          });
        },
      );
    },

    updateNoteContent: (noteId, content, contentString, isBeaconRequest) => {
      const token = useAuthStore.getState().token;
      if (isBeaconRequest && token) {
        return NotesService.updateNoteContentBeacon(
          noteId,
          content,
          contentString,
          token,
        );
      }
      return NotesService.updateNoteContent(noteId, content, contentString);
    },

    uploadNoteImage: (noteId, image) => {
      return NotesService.uploadNoteImage(noteId, image);
    },

    createFolder: (
      uid,
      gameId,
      parentFolderId,
      name,
      order,
      readPermissions,
      editPermissions,
      isRootPlayerFolder,
    ) => {
      return NoteFoldersService.addFolder(
        uid,
        gameId,
        parentFolderId,
        order,
        name,
        readPermissions,
        editPermissions,
        isRootPlayerFolder ?? false,
      );
    },
    updateFolderName: (folderId, name) => {
      return NoteFoldersService.updateFolderName(folderId, name);
    },
    moveFolder: (folderId, newParentFolderId, updatePermissions) => {
      return new Promise((resolve, reject) => {
        const state = getState();

        const parentFolder = state.folderState.folders[newParentFolderId];
        if (!parentFolder) {
          reject(new Error("Parent folder not found"));
          return;
        }

        const promises: Promise<void>[] = [];

        promises.push(
          NoteFoldersService.updateParentFolder(folderId, newParentFolderId),
        );
        if (updatePermissions) {
          promises.push(
            state.updateFolderPermissions(
              folderId,
              parentFolder.readPermissions,
              parentFolder.editPermissions,
            ),
          );
        }

        Promise.all(promises)
          .then(() => {
            resolve();
          })
          .catch(reject);
      });
    },
    updateFolderPermissions: (folderId, readPermissions, editPermissions) => {
      return new Promise((resolve, reject) => {
        const state = getState();
        const folder = state.folderState.folders[folderId];
        if (!folder) {
          reject(new Error("Folder not found"));
          return;
        }
        const descendants = getState().getFolderDescendants(folderId);
        const foldersToUpdate = Object.keys(descendants.folders).filter(
          (folderId) => {
            const subFolder = descendants.folders[folderId];
            if (
              subFolder.readPermissions === folder.readPermissions &&
              subFolder.editPermissions === folder.editPermissions
            ) {
              return true;
            }
            return false;
          },
        );

        foldersToUpdate.push(folderId);

        const notesToUpdate = Object.keys(descendants.notes).filter(
          (noteId) => {
            const note = descendants.notes[noteId];
            if (
              note.readPermissions === folder.readPermissions &&
              note.editPermissions === folder.editPermissions
            ) {
              return true;
            }
            return false;
          },
        );

        NoteFoldersService.updateFolderPermissions(
          foldersToUpdate,
          notesToUpdate,
          readPermissions,
          editPermissions,
        )
          .then(() => {
            resolve();
          })
          .catch(reject);
      });
    },
    deleteFolder: (folderId) => {
      return NoteFoldersService.deleteFolder(folderId);
    },

    createNote: (gameId, uid, parentFolderId, title, order) => {
      const parentFolder = getState().folderState.folders[parentFolderId];
      if (!parentFolder) {
        return Promise.reject(new Error("Parent folder not found"));
      }
      return NotesService.addNote(
        gameId,
        uid,
        parentFolderId,
        title,
        order,
        parentFolder.readPermissions,
        parentFolder.editPermissions,
      );
    },
    updateNoteName: (noteId, title) => {
      return NotesService.updateNoteName(noteId, title);
    },
    updateNoteOrder: (noteId, order) => {
      return NotesService.updateNoteOrder(noteId, order);
    },
    moveNote: (noteId, newParentFolderId, updatePermissions) => {
      const state = getState();
      const note = state.noteState.notes[noteId];
      const parentFolder = state.folderState.folders[newParentFolderId];

      const notesInParentFolder = Object.values(state.noteState.notes).filter(
        (note) => note.parentFolderId === newParentFolderId,
      );
      const order =
        notesInParentFolder.length > 0
          ? Math.max(
              ...Object.values(state.noteState.notes)
                .filter((note) => note.parentFolderId === newParentFolderId)
                .map((note) => note.order),
            ) + 1
          : 1;

      if (!note || !parentFolder) {
        return Promise.reject(new Error("Note or folder not found"));
      }

      const readPermissions = updatePermissions
        ? parentFolder.readPermissions
        : note.readPermissions;
      const editPermissions = updatePermissions
        ? parentFolder.editPermissions
        : note.editPermissions;

      return NotesService.updateNoteParentFolder(
        noteId,
        newParentFolderId,
        order,
        readPermissions,
        editPermissions,
      );
    },
    updateNotePermissions: (noteId, readPermissions, editPermissions) => {
      return NotesService.updateNotePermissions(
        noteId,
        readPermissions,
        editPermissions,
      );
    },
    deleteNote: (noteId) => {
      return NotesService.deleteNote(noteId);
    },

    getFolderDescendants: (folderId) => {
      const checkedFolderMap: Record<string, boolean> = {};
      const folders: Record<string, INoteFolder> = {};
      const notes: Record<string, INote> = {};

      const { folderState, noteState } = getState();
      const allFolders = folderState.folders;
      function processAncestorsAndReturnResult(
        testingFolderId: string,
      ): boolean {
        if (testingFolderId in checkedFolderMap) {
          return checkedFolderMap[testingFolderId];
        }

        if (testingFolderId === folderId) {
          checkedFolderMap[testingFolderId] = true;
          folders[testingFolderId] = allFolders[testingFolderId];
          return true;
        }

        const folder = allFolders[testingFolderId];
        if (!folder) {
          return false;
        }
        if (folder.parentFolderId) {
          const result = processAncestorsAndReturnResult(folder.parentFolderId);
          checkedFolderMap[testingFolderId] = result;
          if (result) {
            folders[testingFolderId] = folder;
          }
          return result;
        }
        return false;
      }

      Object.keys(allFolders).forEach((id) => {
        if (processAncestorsAndReturnResult(id)) {
          checkedFolderMap[id] = true;
        }
      });

      Object.entries(noteState.notes).forEach(([noteId, note]) => {
        const parentFolder = note.parentFolderId;
        if (checkedFolderMap[parentFolder]) {
          notes[noteId] = note;
        }
      });

      return { folders, notes };
    },

    reset: () => {
      set((store) => ({ ...store, ...defaultNotesState }));
    },

    openItemTab: ({
      type,
      id,
      replacedTabId,
      openInBackground,
      disallowDuplicates,
    }) => {
      set((store) => {
        const tabId = replacedTabId ?? createId();
        const tabItem: IOpenNoteItem = { type, itemId: id };

        if (
          disallowDuplicates &&
          Object.values(store.noteTabItems).some(
            (item) => item.type === type && item.itemId === id,
          )
        ) {
          return;
        }

        if (!replacedTabId) {
          store.noteTabOrder.push(tabId);
        }
        if (!openInBackground) {
          store.openTabItemId = tabId;
        }

        store.noteTabItems[tabId] = tabItem;
      });
    },

    switchToTab: (tabId) => {
      set((store) => {
        store.openTabItemId = tabId;
      });
    },

    closeTab: (tabId) => {
      set((store) => {
        // Remove the tab from the order
        const tabIndex = store.noteTabOrder.indexOf(tabId);
        if (tabIndex !== -1) {
          store.noteTabOrder.splice(tabIndex, 1);
        }
        // Remove the tab from the map
        delete store.noteTabItems[tabId];
        // If the tab is the open tab, choose the next tab in the array if it exists, the previous one if it doesn't, and null if all else fails.
        if (store.openTabItemId === tabId) {
          store.openTabItemId =
            store.noteTabOrder[tabIndex] ??
            store.noteTabOrder[tabIndex - 1] ??
            null;
        }
      });
    },

    closeTabsMatching: (type, id) => {
      set((store) => {
        Object.entries(store.noteTabItems)
          .filter(([, item]) => item.type === type && item.itemId === id)
          .forEach(([tabId]) => {
            store.closeTab(tabId);
          });
      });
    },
  })),
  deepEqual,
);

export function useListenToGameNotes(gameId: string | undefined) {
  const uid = useUID();
  const { gamePermission, gameType } = useGamePermissions();

  const resetStore = useNotesStore((store) => store.reset);
  const listenToNoteFolders = useNotesStore(
    (store) => store.listenToGameNoteFolders,
  );
  const listenToNotes = useNotesStore((store) => store.listenToGameNotes);
  const listenToNoteContents = useNotesStore(
    (store) => store.listenToNoteContent,
  );

  const openNoteItems = useNotesStore((store) =>
    Array.from(
      new Set(
        Object.values(store.noteTabItems)
          .filter((item) => item.type === "note")
          .map((item) => item.itemId),
      ),
    ),
  );
  const noteItemContentListeners = useRef<Map<string, () => void>>(new Map());

  useEffect(() => {
    if (gameId && gamePermission) {
      return listenToNoteFolders(uid, gameId, gamePermission);
    }
  }, [gameId, uid, gamePermission, listenToNoteFolders, gameType]);

  useEffect(() => {
    if (gameId && gamePermission) {
      return listenToNotes(uid, gameId, gamePermission);
    }
  }, [gameId, uid, gamePermission, listenToNotes, gameType]);

  useEffect(() => {
    // Loop through all open note items and create listeners for their content if they don't exist yet
    openNoteItems.forEach((noteId) => {
      if (!noteItemContentListeners.current.has(noteId)) {
        const listener = listenToNoteContents(noteId);
        noteItemContentListeners.current.set(noteId, listener);
      }
    });
    // Loop through all listeners and remove them if the note is not open anymore
    noteItemContentListeners.current.forEach((listener, noteId) => {
      if (!openNoteItems.includes(noteId)) {
        listener();
        noteItemContentListeners.current.delete(noteId);
      }
    });
  }, [openNoteItems, listenToNoteContents]);

  useEffect(() => {
    return () => {
      noteItemContentListeners.current.forEach((listener) => {
        listener();
      });
      noteItemContentListeners.current.clear();
    };
  }, []);

  useEffect(() => {
    return () => {
      resetStore();
    };
  }, [gameId, uid, resetStore]);
}

export function getPlayerNotesFolder(
  playerId: string,
  folders: Record<string, INoteFolder>,
): INoteFolder | undefined {
  return Object.values(folders).find((folder) => {
    return folder.creator === playerId && folder.isRootPlayerFolder;
  });
}

function getPermissions(
  writePermissions: EditPermissions,
  authorId: string,
  uid: string | undefined,
  gamePermission: GamePermission,
): Permissions {
  if (!uid || gamePermission === GamePermission.Viewer) {
    return { canEdit: false, canDelete: false, canChangePermissions: false };
  }

  const isUserGuide = gamePermission === GamePermission.Guide;
  const isUserAuthor = authorId === uid;

  if (writePermissions === EditPermissions.AllPlayers) {
    return {
      canEdit: true,
      canDelete: isUserAuthor,
      canChangePermissions: isUserAuthor,
    };
  }

  if (writePermissions === EditPermissions.OnlyAuthor) {
    return {
      canEdit: isUserAuthor,
      canDelete: isUserAuthor,
      canChangePermissions: isUserAuthor,
    };
  }

  if (writePermissions === EditPermissions.GuidesAndAuthor) {
    return {
      canEdit: isUserAuthor || isUserGuide,
      canDelete: isUserAuthor,
      canChangePermissions: isUserAuthor,
    };
  }

  if (writePermissions === EditPermissions.OnlyGuides) {
    return {
      canEdit: isUserGuide,
      canDelete: isUserGuide,
      canChangePermissions: isUserGuide,
    };
  }

  return { canEdit: false, canDelete: false, canChangePermissions: false };
}
