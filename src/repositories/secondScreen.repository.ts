// Type
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase.lib";

import { Tables, TablesUpdate } from "@/types/supabase-generated.type";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  getRepositoryError,
  RepositoryError,
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
    const startInitialLoad = () => {
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
    };
    const handlePayload = (
      payload: RealtimePostgresChangesPayload<GameSecondScreenDTO>,
    ) => {
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
    };

    const unsubscribe = createSubscription(
      `game_second_screen_settings:game_id=eq.${gameId}`,
      "game_second_screen_settings",
      `game_id=eq.${gameId}`,
      startInitialLoad,
      handlePayload,
    );

    return () => {
      unsubscribe();
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
