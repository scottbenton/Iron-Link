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
export type WorldEntryBondUpdateDTO = TablesUpdate<"world_entry_bonds">;
export type WorldEntryBondKey = Pick<
  WorldEntryBondDTO,
  "entry_id" | "character_id"
>;

type BondColumn = "entry_id" | "character_id";

// Bonds are read by entry (the entry page) or by character (the character
// sheet). RLS filters every read and event to bonds on entries the reader can
// see. Realtime does not filter deletes, which carry only the key, so each
// listener checks a deleted bond is one of its own.
export class WorldEntryBondsRepository {
  private static bonds = () => supabase.from("world_entry_bonds");

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

  public static updateBond(
    key: WorldEntryBondKey,
    bond: WorldEntryBondUpdateDTO,
  ): Promise<WorldEntryBondDTO> {
    return new Promise((resolve, reject) => {
      this.bonds()
        .update(bond)
        .eq("entry_id", key.entry_id)
        .eq("character_id", key.character_id)
        .select()
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.WorldEntryBond,
                false,
                status,
              ),
            );
          } else if (data.length === 0) {
            // RLS filters a refused update instead of raising.
            reject(
              createRepositoryError(
                ErrorReason.Forbidden,
                ErrorVerb.Update,
                ErrorNoun.WorldEntryBond,
                false,
              ),
            );
          } else {
            resolve(data[0]);
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
}
