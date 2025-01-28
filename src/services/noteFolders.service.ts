import { GamePermission } from "stores/game.store";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  NoteFolderDTO,
  NoteFoldersRepository,
} from "repositories/noteFolders.repository";
import { NotesRepository } from "repositories/notes.repository";
import { EditPermissions, ReadPermissions } from "repositories/shared.types";

export type INoteFolder = {
  id: string;
  gameId: string;
  name?: string;
  order: number;
  isRootPlayerFolder: boolean;
  // Null if this is a root folder
  parentFolderId: string | null;
  creator: string;

  // Permission sets cannot be null - if we update a parent, we need to manually update children
  readPermissions: ReadPermissions;
  editPermissions: EditPermissions;
};

export class NoteFoldersService {
  public static listenToGameNoteFolders(
    uid: string | undefined,
    gameId: string,
    permissions: GamePermission,
    onNoteFolderChanges: (
      changedNoteFolders: Record<string, INoteFolder>,
      removedNoteFolderIds: string[],
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return NoteFoldersRepository.listenToNoteFolders(
      uid,
      gameId,
      permissions,
      (changedFolders, removedIds) =>
        onNoteFolderChanges(
          Object.fromEntries(
            Object.entries(changedFolders).map(([folderId, folder]) => [
              folderId,
              this.convertNoteFolderDTOToNoteFolder(folder),
            ]),
          ),
          removedIds,
        ),
      onError,
    );
  }

  public static addFolder(
    uid: string,
    gameId: string,
    parentFolderId: string | null,
    order: number,
    name: string,
    readPermissions: ReadPermissions,
    editPermissions: EditPermissions,
    isRootPlayerFolder: boolean,
  ): Promise<string> {
    return NoteFoldersRepository.addNoteFolder({
      name,
      game_id: gameId,
      order,
      parent_folder_id: parentFolderId,
      author_id: uid,
      is_root_player_folder: isRootPlayerFolder,
      read_permissions: readPermissions,
      edit_permissions: editPermissions,
    });
  }
  public static updateFolderName(
    folderId: string,
    name: string,
  ): Promise<void> {
    return NoteFoldersRepository.updateNoteFolder(folderId, { name });
  }

  public static updateFolderPermissions(
    folderIds: string[],
    noteIds: string[],
    readPermissions: ReadPermissions,
    editPermissions: EditPermissions,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const promises: Promise<void>[] = [];
      promises.push(
        NoteFoldersRepository.massUpdateNoteFolders(folderIds, {
          read_permissions: readPermissions,
          edit_permissions: editPermissions,
        }),
      );
      promises.push(
        NotesRepository.massUpdateNotes(noteIds, {
          read_permissions: readPermissions,
          edit_permissions: editPermissions,
        }),
      );

      Promise.all(promises)
        .then(() => resolve())
        .catch(reject);
    });
  }
  public static updateParentFolder(
    folderId: string,
    parentFolderId: string,
  ): Promise<void> {
    return NoteFoldersRepository.updateNoteFolder(folderId, {
      parent_folder_id: parentFolderId,
    });
  }

  public static deleteFolder(folderId: string): Promise<void> {
    return NoteFoldersRepository.deleteNoteFolder(folderId);
  }

  private static convertNoteFolderDTOToNoteFolder(
    noteFolder: NoteFolderDTO,
  ): INoteFolder {
    let readPermissions: ReadPermissions;
    switch (noteFolder.read_permissions) {
      case "only_author":
        readPermissions = ReadPermissions.OnlyAuthor;
        break;
      case "only_guides":
        readPermissions = ReadPermissions.OnlyGuides;
        break;
      case "all_players":
        readPermissions = ReadPermissions.AllPlayers;
        break;
      case "guides_and_author":
        readPermissions = ReadPermissions.GuidesAndAuthor;
        break;
      case "public":
        readPermissions = ReadPermissions.Public;
        break;
      default:
        readPermissions = ReadPermissions.OnlyAuthor;
    }
    let editPermissions: EditPermissions;
    switch (noteFolder.edit_permissions) {
      case "only_author":
        editPermissions = EditPermissions.OnlyAuthor;
        break;
      case "only_guides":
        editPermissions = EditPermissions.OnlyGuides;
        break;
      case "guides_and_author":
        editPermissions = EditPermissions.GuidesAndAuthor;
        break;
      case "all_players":
        editPermissions = EditPermissions.AllPlayers;
        break;
      default:
        editPermissions = EditPermissions.OnlyAuthor;
    }
    return {
      id: noteFolder.id,
      gameId: noteFolder.game_id,
      name: noteFolder.name ?? undefined,
      order: noteFolder.order,
      parentFolderId: noteFolder.parent_folder_id,
      creator: noteFolder.author_id,
      isRootPlayerFolder: noteFolder.is_root_player_folder,
      readPermissions,
      editPermissions,
    };
  }
}
