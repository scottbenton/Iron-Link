import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "types/supabase-generated.type";

import { GamePermission } from "stores/game.store";

import { supabase } from "lib/supabase.lib";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export type NoteFolderDTO = Tables<"note_folders">;
type NoteFolderInsertDTO = TablesInsert<"note_folders">;
type NoteFolderUpdateDTO = TablesUpdate<"note_folders">;

export type PartialNoteFolderDTO = Partial<NoteFolderDTO>;

export class NoteFoldersRepository {
  private static noteFolders = () => supabase.from("note_folders");

  public static listenToNoteFolders(
    uid: string | undefined,
    gameId: string,
    permissions: GamePermission,
    onNoteFolderChanges: (
      changedNoteFolders: Record<string, NoteFolderDTO>,
      deletedNoteFolderIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    const startInitialLoad = () => {
      // Fetch initial results
      const query = this.noteFolders().select().eq("game_id", gameId);

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

      query.then(({ data, error, status }) => {
        if (error) {
          onError(
            getRepositoryError(
              error,
              ErrorVerb.Read,
              ErrorNoun.NoteFolders,
              true,
              status,
            ),
          );
        } else {
          onNoteFolderChanges(
            data.reduce(
              (acc, folder) => {
                acc[folder.id] = folder;
                return acc;
              },
              {} as Record<string, NoteFolderDTO>,
            ),
            [],
            true,
          );
        }
      });
    };
    const handlePayload = (
      payload: RealtimePostgresChangesPayload<NoteFolderDTO>,
    ) => {
      if (payload.errors) {
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.NoteFolders,
            true,
          ),
        );
      } else {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          // Check permissions
          if (
            permissions === GamePermission.Viewer &&
            payload.new.read_permissions === "public"
          ) {
            onNoteFolderChanges({ [payload.new.id]: payload.new }, [], false);
          } else if (
            permissions === GamePermission.Player &&
            (payload.new.read_permissions === "public" ||
              payload.new.read_permissions === "all_players" ||
              (payload.new.read_permissions === "only_author" &&
                payload.new.author_id === uid) ||
              (payload.new.read_permissions === "guides_and_author" &&
                payload.new.author_id === uid))
          ) {
            onNoteFolderChanges({ [payload.new.id]: payload.new }, [], false);
          } else if (
            permissions === GamePermission.Guide &&
            (payload.new.read_permissions === "public" ||
              payload.new.read_permissions === "all_players" ||
              payload.new.read_permissions === "only_guides" ||
              (payload.new.read_permissions === "only_author" &&
                payload.new.author_id === uid) ||
              payload.new.read_permissions === "guides_and_author")
          ) {
            onNoteFolderChanges({ [payload.new.id]: payload.new }, [], false);
          }
        } else if (payload.eventType === "DELETE" && payload.old.id) {
          onNoteFolderChanges({}, [payload.old.id], false);
        }
      }
    };

    const unsubscribe = createSubscription(
      `note_folders:game_id=eq.${gameId},uid=eq.${uid}`,
      "note_folders",
      `game_id=eq.${gameId}`,
      startInitialLoad,
      handlePayload,
    );

    return () => {
      unsubscribe();
    };
  }

  public static addNoteFolder(
    noteFolder: NoteFolderInsertDTO,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.noteFolders()
        .insert(noteFolder)
        .select()
        .single()
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Create,
                ErrorNoun.NoteFolders,
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

  public static updateNoteFolder(
    folderId: string,
    updatedNoteFolder: NoteFolderUpdateDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.noteFolders()
        .update(updatedNoteFolder)
        .eq("id", folderId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.NoteFolders,
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

  public static massUpdateNoteFolders(
    folderIds: string[],
    updatedNoteFolder: NoteFolderUpdateDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.noteFolders()
        .update(updatedNoteFolder)
        .in("id", folderIds)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.NoteFolders,
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

  public static deleteNoteFolder(folderId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.noteFolders()
        .delete()
        .eq("id", folderId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Delete,
                ErrorNoun.NoteFolders,
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
}
