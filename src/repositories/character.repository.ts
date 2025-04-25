import { supabase } from "@/lib/supabase.lib";
import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/types/supabase-generated.type";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";
import { StorageRepository } from "./storage.repository";

export type StatsMap = Record<string, number>;
export enum InitiativeStatus {
  HasInitiative = "initiative",
  DoesNotHaveInitiative = "noInitiative",
  OutOfCombat = "outOfCombat",
}
export type CharacterDTO = Tables<"characters">;
type InsertCharacterDTO = TablesInsert<"characters">;
type UpdateCharacterDTO = TablesUpdate<"characters">;

export class CharacterRepository {
  private static characters = () => supabase.from("characters");

  public static async getCharacter(characterId: string): Promise<CharacterDTO> {
    return new Promise((resolve, reject) => {
      this.characters()
        .select()
        .eq("id", characterId)
        .then((result) => {
          if (result.error) {
            console.error(result.error);
            reject(
              getRepositoryError(
                result.error,
                ErrorVerb.Read,
                ErrorNoun.Character,
                false,
                result.status,
              ),
            );
          } else {
            resolve(result.data[0]);
          }
        });
    });
  }

  public static async getCharactersInGames(
    gameIds: string[],
  ): Promise<Record<string, CharacterDTO>> {
    return new Promise((resolve, reject) => {
      if (gameIds.length === 0) {
        resolve({});
        return;
      }
      this.characters()
        .select()
        .in("game_id", gameIds)
        .then((result) => {
          if (result.error) {
            console.error(result.error);
            reject(
              getRepositoryError(
                result.error,
                ErrorVerb.Read,
                ErrorNoun.Character,
                true,
                result.status,
              ),
            );
          } else {
            const characters: Record<string, CharacterDTO> = {};
            result.data.forEach((character) => {
              characters[character.id] = character;
            });
            resolve(characters);
          }
        });
    });
  }

  public static listenToGameCharacters(
    gameId: string,
    onUpdate: (
      changedCharacters: Record<string, CharacterDTO>,
      removedCharacterIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    const startInitialLoad = () => {
      this.characters()
        .select()
        .eq("game_id", gameId)
        .then((result) => {
          if (result.error) {
            console.error(result.error);
            onError(
              getRepositoryError(
                result.error,
                ErrorVerb.Read,
                ErrorNoun.Character,
                true,
                result.status,
              ),
            );
          } else {
            const characters: Record<string, CharacterDTO> = {};
            result.data.forEach((character) => {
              characters[character.id] = character;
            });
            onUpdate(characters, [], true);
          }
        });
    };
    const handlePayload = (
      payload: RealtimePostgresChangesPayload<CharacterDTO>,
    ) => {
      if (payload.errors) {
        console.error(payload.errors);
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.Character,
            true,
          ),
        );
      }
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        onUpdate({ [payload.new.id]: payload.new }, [], false);
      } else if (payload.eventType === "DELETE" && payload.old.id) {
        onUpdate({}, [payload.old.id], false);
      } else {
        console.error("Unknown event type", payload.eventType);
        onError(
          getRepositoryError(
            "Unknown event type",
            ErrorVerb.Read,
            ErrorNoun.Character,
            true,
          ),
        );
      }
    };

    const unsubscribe = createSubscription(
      `characters:game_id=eq.${gameId}`,
      "characters",
      `game_id=eq.${gameId}`,
      startInitialLoad,
      handlePayload,
    );

    return () => {
      unsubscribe();
    };
  }

  public static async createCharacter(
    character: InsertCharacterDTO,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.characters()
        .insert(character)
        .select()
        .single()
        .then((result) => {
          if (result.error) {
            console.error(result.error);
            reject(
              getRepositoryError(
                result.error,
                ErrorVerb.Create,
                ErrorNoun.Character,
                false,
                result.status,
              ),
            );
          } else {
            resolve(result.data.id);
          }
        });
    });
  }

  public static getCharacterImageLink(characterId: string, filename: string) {
    return StorageRepository.getImageUrl("characters", characterId, filename);
  }

  public static async uploadCharacterImage(
    characterId: string,
    file: File,
  ): Promise<string> {
    return StorageRepository.storeImage("characters", characterId, file);
  }

  public static async deleteCharacterPortrait(
    characterId: string,
    filename: string,
  ): Promise<void> {
    return StorageRepository.deleteImage("characters", characterId, filename);
  }

  public static async updateCharacter(
    characterId: string,
    character: UpdateCharacterDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.characters()
        .update(character)
        .eq("id", characterId)
        .then((result) => {
          if (result.error) {
            console.error(result.error);
            reject(
              getRepositoryError(
                result.error,
                ErrorVerb.Update,
                ErrorNoun.Character,
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

  public static async deleteCharacter(characterId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.characters()
        .delete()
        .eq("id", characterId)
        .then((result) => {
          if (result.error) {
            console.error(result.error);
            reject(
              getRepositoryError(
                result.error,
                ErrorVerb.Delete,
                ErrorNoun.Character,
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
