// Type
import { Tables, TablesUpdate } from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import {
  StorageError,
  convertUnknownErrorToStorageError,
} from "./errors/storageErrors";

export type GameSecondScreenDTO = Tables<"game_second_screen_settings">;
type UpdateSecondScreenDTO = TablesUpdate<"game_second_screen_settings">;

export class SecondScreenRepository {
  private static secondScreen = () =>
    supabase.from("game_second_screen_settings");

  public static listenToSecondScreenSettings(
    gameId: string,
    onSettings: (settings: GameSecondScreenDTO | null) => void,
    onError: (error: StorageError) => void,
  ): () => void {
    // Initial fetch
    this.secondScreen()
      .select()
      .eq("game_id", gameId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          if (error.code === "PGRST116") {
            onSettings(null);
            return;
          }
          console.error(error);
          onError(
            convertUnknownErrorToStorageError(
              error,
              "Failed to fetch second screen settings",
            ),
          );
        } else {
          onSettings(data);
        }
      });

    // Subscription
    const subscription = supabase
      .channel(`game_second_screen_settings:game_id=eq.${gameId}`)
      .on<GameSecondScreenDTO>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_second_screen_settings",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.errors) {
            console.error(payload.errors);
            onError(
              convertUnknownErrorToStorageError(
                payload.errors,
                "Failed to fetch second screen settings",
              ),
            );
          } else if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            onSettings(payload.new);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  public static async updateSecondScreenSettings(
    gameId: string,
    settings: UpdateSecondScreenDTO,
  ): Promise<void> {
    const { error } = await this.secondScreen().upsert({
      game_id: gameId,
      ...settings,
    });

    if (error) {
      throw convertUnknownErrorToStorageError(
        error,
        "Failed to update second screen settings",
      );
    }

    return;
  }
}
