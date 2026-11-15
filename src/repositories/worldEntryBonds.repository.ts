import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorReason,
  ErrorVerb,
  RepositoryError,
  createRepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export type WorldEntryBondDTO = Tables<"world_entry_bonds">;
export type WorldEntryBondInsertDTO = TablesInsert<"world_entry_bonds">;
export type WorldEntryBondKey = Pick<
  WorldEntryBondDTO,
  "entry_id" | "character_id"
>;
export type WorldEntryConnectionDTO = Tables<"world_entry_connections">;
export type WorldEntryConnectionUpdateDTO =
  TablesUpdate<"world_entry_connections">;

type BondColumn = "entry_id" | "character_id";

// Bonds are read by entry (the entry page) or by character (the character
// sheet), and connections by game. RLS filters every read and event to bonds
// and connections on entries the reader can see. Realtime does not filter
// deletes, which carry only the key, so each listener checks a deleted row is
// one of its own.
export class WorldEntryBondsRepository {
  private static bonds = () => supabase.from("world_entry_bonds");
  private static connections = () => supabase.from("world_entry_connections");

  public static listenToEntryBonds(
    entryId: string,
    onBonds: (
      changed: WorldEntryBondDTO[],
      removed: WorldEntryBondKey[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return this.listen("entry_id", entryId, onBonds, onError);
  }

  public static listenToCharacterBonds(
    characterId: string,
    onBonds: (
      changed: WorldEntryBondDTO[],
      removed: WorldEntryBondKey[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return this.listen("character_id", characterId, onBonds, onError);
  }

  private static listen(
    column: BondColumn,
    id: string,
    onBonds: (
      changed: WorldEntryBondDTO[],
      removed: WorldEntryBondKey[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return createSubscription<WorldEntryBondDTO>(
      `world_entry_bonds:${column}=eq.${id}`,
      "world_entry_bonds",
      `${column}=eq.${id}`,
      (isCurrent) => {
        this.bonds()
          .select()
          .eq(column, id)
          .then(({ data, error, status }) => {
            if (!isCurrent()) return;
            if (error) {
              console.error(error);
              onError(
                getRepositoryError(
                  error,
                  ErrorVerb.Read,
                  ErrorNoun.WorldEntryBond,
                  true,
                  status,
                ),
              );
            } else {
              onBonds(data, [], true);
            }
          });
      },
      (payload: RealtimePostgresChangesPayload<WorldEntryBondDTO>) => {
        if (payload.eventType === "DELETE") {
          const { entry_id, character_id } = payload.old;
          if (entry_id && character_id && payload.old[column] === id) {
            onBonds([], [{ entry_id, character_id }], false);
          }
        } else if (payload.new[column] === id) {
          onBonds([payload.new], [], false);
        }
      },
      { loadBeforeJoin: true },
    );
  }

  public static createBond(
    bond: WorldEntryBondInsertDTO,
  ): Promise<WorldEntryBondDTO> {
    return new Promise((resolve, reject) => {
      this.bonds()
        .insert(bond)
        .select()
        .single()
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Create,
                ErrorNoun.WorldEntryBond,
                false,
                status,
              ),
            );
          } else {
            resolve(data);
          }
        });
    });
  }

  public static deleteBond(key: WorldEntryBondKey): Promise<void> {
    return new Promise((resolve, reject) => {
      this.bonds()
        .delete()
        .eq("entry_id", key.entry_id)
        .eq("character_id", key.character_id)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Delete,
                ErrorNoun.WorldEntryBond,
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

  public static listenToGameConnections(
    gameId: string,
    onConnections: (
      changed: WorldEntryConnectionDTO[],
      removedIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return createSubscription<WorldEntryConnectionDTO>(
      `world_entry_connections:game_id=eq.${gameId}`,
      "world_entry_connections",
      `game_id=eq.${gameId}`,
      (isCurrent) => {
        this.connections()
          .select()
          .eq("game_id", gameId)
          .then(({ data, error, status }) => {
            if (!isCurrent()) return;
            if (error) {
              console.error(error);
              onError(
                getRepositoryError(
                  error,
                  ErrorVerb.Read,
                  ErrorNoun.WorldEntryBond,
                  true,
                  status,
                ),
              );
            } else {
              onConnections(data, [], true);
            }
          });
      },
      (payload: RealtimePostgresChangesPayload<WorldEntryConnectionDTO>) => {
        if (payload.eventType === "DELETE") {
          // The store ignores ids it does not hold.
          if (payload.old.id) onConnections([], [payload.old.id], false);
        } else if (payload.new.game_id === gameId) {
          onConnections([payload.new], [], false);
        }
      },
      { loadBeforeJoin: true },
    );
  }

  // Makes a connection with its first member, then reads it back.
  public static async createConnection(
    entryId: string,
    characterId: string,
    rank: WorldEntryConnectionDTO["rank"],
  ): Promise<WorldEntryConnectionDTO> {
    const {
      data: id,
      error,
      status,
    } = await supabase.rpc("create_world_entry_connection", {
      p_entry_id: entryId,
      p_character_id: characterId,
      p_rank: rank,
    });
    if (error) {
      console.error(error);
      throw getRepositoryError(
        error,
        ErrorVerb.Create,
        ErrorNoun.WorldEntryBond,
        false,
        status,
      );
    }
    const read = await this.connections().select().eq("id", id).single();
    if (read.error) {
      console.error(read.error);
      throw getRepositoryError(
        read.error,
        ErrorVerb.Read,
        ErrorNoun.WorldEntryBond,
        false,
        read.status,
      );
    }
    return read.data;
  }

  public static async updateConnection(
    connectionId: string,
    connection: WorldEntryConnectionUpdateDTO,
  ): Promise<WorldEntryConnectionDTO> {
    const { data, error, status } = await this.connections()
      .update(connection)
      .eq("id", connectionId)
      .select();
    if (error) {
      console.error(error);
      throw getRepositoryError(
        error,
        ErrorVerb.Update,
        ErrorNoun.WorldEntryBond,
        false,
        status,
      );
    }
    if (data.length === 0) {
      // RLS filters a refused update instead of raising.
      throw createRepositoryError(
        ErrorReason.Forbidden,
        ErrorVerb.Update,
        ErrorNoun.WorldEntryBond,
        false,
      );
    }
    return data[0];
  }
}
