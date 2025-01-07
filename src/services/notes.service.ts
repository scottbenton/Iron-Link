import { Buffer } from "buffer";

import { GamePermission } from "stores/game.store";

import { StorageError } from "repositories/errors/storageErrors";
import { NoteDTO, NotesRepository } from "repositories/notes.repository";
import { EditPermissions, ReadPermissions } from "repositories/shared.types";

export type INote = {
  title: string;
  order: number;

  creator: string;

  parentFolderId: string;

  // Permission sets can be null - we query folders first.
  readPermissions: ReadPermissions;
  editPermissions: EditPermissions;
};

export interface INoteContent {
  content: Uint8Array;
}

export class NotesService {
  public static listenToGameNotes(
    uid: string | undefined,
    gameId: string,
    gamePermissions: GamePermission,
    onNoteChanges: (
      changedNotes: Record<string, INote>,
      removedNoteIds: string[],
    ) => void,
    onError: (error: StorageError) => void,
  ): () => void {
    return NotesRepository.listenToNotes(
      uid,
      gameId,
      gamePermissions,
      (changedNotes, removedNoteIds) => {
        onNoteChanges(
          Object.fromEntries(
            Object.entries(changedNotes).map(([noteId, note]) => [
              noteId,
              this.convertNoteDTOToNote(note),
            ]),
          ),
          removedNoteIds,
        );
      },
      onError,
    );
  }

  public static addNote(
    uid: string,
    parentFolderId: string,
    title: string,
    order: number,
    readPermissions: ReadPermissions,
    editPermissions: EditPermissions,
  ): Promise<string> {
    return NotesRepository.addNote({
      author_id: uid,
      parent_folder_id: parentFolderId,
      title,
      order,
      read_permissions: readPermissions,
      edit_permissions: editPermissions,
    });
  }

  public static updateNoteName(noteId: string, title: string): Promise<void> {
    return NotesRepository.updateNote(noteId, { title });
  }

  public static updateNotePermissions(
    noteId: string,
    readPermissions: ReadPermissions,
    editPermissions: EditPermissions,
  ): Promise<void> {
    return NotesRepository.updateNote(noteId, {
      read_permissions: readPermissions,
      edit_permissions: editPermissions,
    });
  }

  public static updateNoteOrder(noteId: string, order: number): Promise<void> {
    return NotesRepository.updateNote(noteId, { order });
  }

  public static updateNoteParentFolder(
    noteId: string,
    parentFolderId: string,
    order: number,
    readPermissions: ReadPermissions,
    editPermissions: EditPermissions,
  ): Promise<void> {
    return NotesRepository.updateNote(noteId, {
      parent_folder_id: parentFolderId,
      order,
      read_permissions: readPermissions,
      edit_permissions: editPermissions,
    });
  }

  public static deleteNote(noteId: string): Promise<void> {
    return NotesRepository.deleteNote(noteId);
  }

  public static listenToNoteContent(
    noteId: string,
    onNoteContentChanged: (noteContent: INoteContent) => void,
    onError: (error: StorageError) => void,
  ): () => void {
    return NotesRepository.listenToNoteContent(
      noteId,
      (noteDTO) => {
        onNoteContentChanged({
          content: noteDTO.note_content_bytes
            ? this.databaseToUint8Array(noteDTO.note_content_bytes)
            : new Uint8Array(),
        });
      },
      onError,
    );
  }

  public static async updateNoteContent(
    noteId: string,
    noteContent: Uint8Array,
    noteContentText: string,
    isBeaconRequest?: boolean,
  ): Promise<void> {
    console.debug("WAS BEACON REQUEST", isBeaconRequest);
    return NotesRepository.updateNote(noteId, {
      note_content_bytes: this.uint8ArrayToDatabase(noteContent),
      note_content_text: noteContentText,
    });
  }

  private static convertNoteDTOToNote(note: NoteDTO): INote {
    let readPermissions: ReadPermissions;
    switch (note.read_permissions) {
      case "all_players":
        readPermissions = ReadPermissions.AllPlayers;
        break;
      case "guides_and_author":
        readPermissions = ReadPermissions.GuidesAndAuthor;
        break;
      case "only_author":
        readPermissions = ReadPermissions.OnlyAuthor;
        break;
      case "only_guides":
        readPermissions = ReadPermissions.OnlyGuides;
        break;
      case "public":
        readPermissions = ReadPermissions.Public;
        break;
    }
    let editPermissions: EditPermissions;
    switch (note.edit_permissions) {
      case "all_players":
        editPermissions = EditPermissions.AllPlayers;
        break;
      case "guides_and_author":
        editPermissions = EditPermissions.GuidesAndAuthor;
        break;
      case "only_author":
        editPermissions = EditPermissions.OnlyAuthor;
        break;
      case "only_guides":
        editPermissions = EditPermissions.OnlyGuides;
        break;
    }

    return {
      title: note.title ?? "",
      order: note.order,
      creator: note.author_id,
      parentFolderId: note.parent_folder_id,
      readPermissions,
      editPermissions,
    };
  }

  private static uint8ArrayToDatabase(arr: Uint8Array): string {
    return "\\x" + Buffer.from(arr).toString("hex");
  }
  private static databaseToUint8Array(str: string): Uint8Array {
    return Buffer.from(str.slice(2), "hex");
  }
}
