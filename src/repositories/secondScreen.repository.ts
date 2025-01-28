// Type
import { Tables, TablesUpdate } from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export type GameSecondScreenDTO = Tables<"game_second_screen_settings">;
type UpdateSecondScreenDTO = TablesUpdate<"game_second_screen_settings">;

export class SecondScreenRepository {
  private static secondScreen = () =>
    supabase.from("game_second_screen_settings");

  public static listenToSecondScreenSettings(
    gameId: string,
    onSettings: (settings: GameSecondScreenDTO | null) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    // Initial fetch
    this.secondScreen()
      .select()
      .eq("game_id", gameId)
      .single()
      .then(({ data, error, status }) => {
        if (error) {
          if (error.code === "PGRST116") {
            onSettings(null);
            return;
          }
          console.error(error);
          onError(
            getRepositoryError(
              error,
              ErrorVerb.Read,
              ErrorNoun.SecondScreen,
              false,
              status,
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
              getRepositoryError(
                payload.errors,
                ErrorVerb.Read,
                ErrorNoun.SecondScreen,
                false,
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
    const { error, status } = await this.secondScreen().upsert({
      game_id: gameId,
      ...settings,
    });

    if (error) {
      throw getRepositoryError(
        error,
        ErrorVerb.Update,
        ErrorNoun.SecondScreen,
        false,
        status,
      );
    }

    return;
  }
}
