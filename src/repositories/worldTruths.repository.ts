import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { Tables } from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export type WorldTruthDTO = Tables<"world_truths">;
export type WorldTruthQuestStarterDTO = Tables<"world_truth_quest_starters">;

type Listener<T> = (
  changed: T[],
  removedTruthIds: string[],
  replaceState: boolean,
) => void;

// Truths are read by world. Every member reads the choices; RLS hands quest
// starters only to world editors and Guides, so for anyone else that listener
// simply stays empty. Realtime does not filter deletes, which carry only the
// key, so each listener checks a deleted row is in its world.
export class WorldTruthsRepository {
  private static truths = () => supabase.from("world_truths");
  private static questStarters = () =>
    supabase.from("world_truth_quest_starters");

  public static listenToWorldTruths(
    worldId: string,
    onTruths: Listener<WorldTruthDTO>,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return this.listen("world_truths", this.truths, worldId, onTruths, onError);
  }

  public static listenToWorldTruthQuestStarters(
    worldId: string,
    onQuestStarters: Listener<WorldTruthQuestStarterDTO>,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return this.listen(
      "world_truth_quest_starters",
      this.questStarters,
      worldId,
      onQuestStarters,
      onError,
    );
  }

  private static listen<T extends { world_id: string; truth_id: string }>(
    table: "world_truths" | "world_truth_quest_starters",
    from: () => ReturnType<typeof supabase.from>,
    worldId: string,
    onRows: Listener<T>,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return createSubscription<T>(
      `${table}:world_id=eq.${worldId}`,
      table,
      `world_id=eq.${worldId}`,
      (isCurrent) => {
        from()
          .select()
          .eq("world_id", worldId)
          .then(
            ({
              data,
              error,
              status,
            }: {
              data: unknown;
              error: unknown;
              status: number;
            }) => {
              if (!isCurrent()) return;
              if (error) {
                console.error(error);
                onError(
                  getRepositoryError(
                    error,
                    ErrorVerb.Read,
                    ErrorNoun.WorldTruth,
                    true,
                    status,
                  ),
                );
              } else {
                onRows(data as T[], [], true);
              }
            },
          );
      },
      (payload: RealtimePostgresChangesPayload<T>) => {
        if (payload.eventType === "DELETE") {
          const { world_id, truth_id } = payload.old;
          if (world_id === worldId && truth_id) onRows([], [truth_id], false);
        } else if (payload.new.world_id === worldId) {
          onRows([payload.new], [], false);
        }
      },
      { loadBeforeJoin: true },
    );
  }

  public static chooseOption(
    worldId: string,
    truthId: string,
    optionId: string,
    subOptionId: string | null,
  ): Promise<void> {
    return this.write(ErrorVerb.Update, () =>
      this.truths().upsert(
        {
          world_id: worldId,
          truth_id: truthId,
          option_id: optionId,
          sub_option_id: subOptionId,
          custom_description: null,
        },
        { onConflict: "world_id,truth_id" },
      ),
    );
  }

  public static setCustomTruth(
    worldId: string,
    truthId: string,
    description: string,
    questStarter: string,
  ): Promise<void> {
    return this.write(ErrorVerb.Update, () =>
      supabase.rpc("set_world_custom_truth", {
        p_world_id: worldId,
        p_truth_id: truthId,
        p_description: description,
        p_quest_starter: questStarter,
      }),
    );
  }

  public static clearTruth(worldId: string, truthId: string): Promise<void> {
    return this.write(ErrorVerb.Delete, () =>
      this.truths().delete().eq("world_id", worldId).eq("truth_id", truthId),
    );
  }

  private static write(
    verb: ErrorVerb,
    run: () => PromiseLike<{ error: unknown; status: number }>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      run().then(({ error, status }) => {
        if (error) {
          console.error(error);
          reject(
            getRepositoryError(
              error,
              verb,
              ErrorNoun.WorldTruth,
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
