import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "types/supabase-generated.type";

import { GamePermission } from "stores/game.store";

import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from "lib/supabase.lib";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export type NoteDTO = Tables<"notes">;
type NoteInsertDTO = TablesInsert<"notes">;
type NoteUpdateDTO = TablesUpdate<"notes">;

export class NotesRepository {
  private static notes = () => supabase.from("notes");

  public static listenToNotes(
    uid: string | undefined,
    gameId: string,
    permissions: GamePermission,
    onNoteChanges: (
      changedNotes: Record<string, NoteDTO>,
      removedNoteIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    const startInitialLoad = () => {
      const query = this.notes()
        .select(
          `
        id,
        author_id,
        parent_folder_id,
        title,
        read_permissions,
        edit_permissions,
        created_at,
        order,
        game_id
        `,
        )
        .eq("game_id", gameId);

      if (permissions === GamePermission.Viewer) {
        query.eq("read_permissions", "public");
      } else if (permissions === GamePermission.Player) {
        query.or(
          `read_permissions.eq."public",read_permissions.eq."all_players",and(read_permissions.eq."only_author",author_id.eq."${uid}"),and(read_permissions.eq."guides_and_author",author_id.eq."${uid}")`,
        );
      } else if (permissions === GamePermission.Guide) {
        query.or(
          `read_permissions.eq."public",read_permissions.eq."all_players",read_permissions.eq."only_guides",and(read_permissions.eq."only_author",author_id.eq."${uid}"),read_permissions.eq."guides_and_author"`,
        );
      }

      query.then((response) => {
        if (response.error) {
          console.error(response.error);
          onError(
            getRepositoryError(
              response.error,
              ErrorVerb.Read,
              ErrorNoun.Note,
              true,
              response.status,
            ),
          );
        } else {
          onNoteChanges(
            Object.fromEntries(
              response.data.map((note) => [
                note.id,
                note as unknown as NoteDTO,
              ]) ?? [],
            ),
            [],
            true,
          );
        }
      });
    };
    const handlePayload = (
      payload: RealtimePostgresChangesPayload<NoteDTO>,
    ) => {
      if (payload.errors) {
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.Note,
            true,
          ),
        );
      } else {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          if (
            permissions === GamePermission.Viewer &&
            payload.new.read_permissions === "public"
          ) {
            onNoteChanges(
              {
                [payload.new.id]: payload.new,
              },
              [],
              false,
            );
          } else if (
            permissions === GamePermission.Player &&
            (payload.new.read_permissions === "public" ||
              payload.new.read_permissions === "all_players" ||
              (payload.new.read_permissions === "only_author" &&
                payload.new.author_id === uid) ||
              (payload.new.read_permissions === "guides_and_author" &&
                payload.new.author_id === uid))
          ) {
            onNoteChanges(
              {
                [payload.new.id]: payload.new,
              },
              [],
              false,
            );
          } else if (
            permissions === GamePermission.Guide &&
            (payload.new.read_permissions === "public" ||
              payload.new.read_permissions === "all_players" ||
              payload.new.read_permissions === "only_guides" ||
              (payload.new.read_permissions === "only_author" &&
                payload.new.author_id === uid) ||
              payload.new.read_permissions === "guides_and_author")
          ) {
            onNoteChanges({ [payload.new.id]: payload.new }, [], false);
          }
        } else if (payload.eventType === "DELETE" && payload.old.id) {
          onNoteChanges({}, [payload.old.id], false);
        }
      }
    };

    const unsubscribe = createSubscription(
      `notes:game_id=${gameId}`,
      "notes",
      `game_id=eq.${gameId}`,
      startInitialLoad,
      handlePayload,
    );

    return () => {
      unsubscribe();
    };
  }

  public static getNoteContent(noteId: string): Promise<NoteDTO> {
    return new Promise((resolve, reject) => {
      this.notes()
        .select("note_content_bytes")
        .eq("id", noteId)
        .single()
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.Note,
                false,
                status,
              ),
            );
          } else {
            resolve(data as NoteDTO);
          }
        });
    });
  }

  public static addNote(note: NoteInsertDTO): Promise<string> {
    return new Promise((resolve, reject) => {
      this.notes()
        .insert(note)
        .select()
        .single()
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Create,
                ErrorNoun.Note,
                false,
                status,
              ),
            );
          } else {
            resolve(data.id);
          }
        });
    });
  }

  public static updateNote(
    noteId: string,
    updatedNote: NoteUpdateDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.notes()
        .update(updatedNote)
        .eq("id", noteId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.Note,
                false,
                status,
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }

  public static updateNoteBeaconRequest(
    token: string,
    noteId: string,
    updatedNote: NoteUpdateDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const endpoint = `${SUPABASE_URL}/rest/v1/notes?id=eq.${noteId}`;
      fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Prefer: "return=minimal",
          Apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(updatedNote),
        keepalive: true,
      }).then((res) => {
        if (!res.ok) {
          console.error(res);
          reject(
            getRepositoryError(
              res,
              ErrorVerb.Update,
              ErrorNoun.Note,
              false,
              res.status,
            ),
          );
        }
        resolve();
      });
    });
  }

  public static massUpdateNotes(
    noteIds: string[],
    updatedNote: NoteUpdateDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.notes()
        .update(updatedNote)
        .in("id", noteIds)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.Note,
                true,
                status,
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }

  public static deleteNote(noteId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.notes()
        .delete()
        .eq("id", noteId)
        .then((result) => {
          const error = result.error;
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Delete,
                ErrorNoun.Note,
                false,
                result.status,
              ),
            );
          } else {
            resolve();
          }
        });
    });
  }
}
