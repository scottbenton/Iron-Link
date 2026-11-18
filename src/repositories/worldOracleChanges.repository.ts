import { Tables } from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";

export type WorldOracleChangeDTO = Tables<"world_oracle_changes">;

// One change as world_oracle_apply_changes reads it. `previousOracleId` is
// what the binding rolls today; a binding that no longer does is skipped.
export interface WorldOracleChangeInputDTO {
  fieldId: string;
  ruleIndex: number | null;
  previousOracleId: string;
  nextOracleId: string;
  keep?: boolean;
}

// Open changes are few (one per moved binding), so every event re-reads the
// world's list rather than patching it. RLS hands them only to world editors
// and Guides; anyone else reads an empty list.
export class WorldOracleChangesRepository {
  private static changes = () => supabase.from("world_oracle_changes");
  private static dismissals = () =>
    supabase.from("world_oracle_change_dismissals");

  public static listenToWorldOracleChanges(
    worldId: string,
    onChanges: (changes: WorldOracleChangeDTO[]) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    let reload = () => {};
    const unsubscribe = createSubscription<WorldOracleChangeDTO>(
      `world_oracle_changes:world_id=eq.${worldId}`,
      "world_oracle_changes",
      `world_id=eq.${worldId}`,
      (isCurrent) => {
        reload = () => this.read(worldId, isCurrent, onChanges, onError);
        reload();
      },
      // Deletes carry only the key and are not filtered by world, so any
      // event re-reads.
      () => reload(),
      { loadBeforeJoin: true },
    );
    return unsubscribe;
  }

  private static read(
    worldId: string,
    isCurrent: () => boolean,
    onChanges: (changes: WorldOracleChangeDTO[]) => void,
    onError: (error: RepositoryError) => void,
  ) {
    this.changes()
      .select()
      .eq("world_id", worldId)
      .then(({ data, error, status }) => {
        if (!isCurrent()) return;
        if (error) {
          console.error(error);
          onError(
            getRepositoryError(
              error,
              ErrorVerb.Read,
              ErrorNoun.WorldOracleChange,
              true,
              status,
            ),
          );
        } else {
          onChanges(data ?? []);
        }
      });
  }

  // How far this game has dismissed the banner for its world, or null.
  public static listenToDismissal(
    gameId: string,
    worldId: string,
    onDismissedSeq: (seq: number | null) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    let reload = () => {};
    return createSubscription<Tables<"world_oracle_change_dismissals">>(
      `world_oracle_change_dismissals:game_id=eq.${gameId}`,
      "world_oracle_change_dismissals",
      `game_id=eq.${gameId}`,
      (isCurrent) => {
        reload = () => {
          this.dismissals()
            .select("dismissed_seq")
            .eq("game_id", gameId)
            .eq("world_id", worldId)
            .maybeSingle()
            .then(({ data, error, status }) => {
              if (!isCurrent()) return;
              if (error) {
                console.error(error);
                onError(
                  getRepositoryError(
                    error,
                    ErrorVerb.Read,
                    ErrorNoun.WorldOracleChange,
                    true,
                    status,
                  ),
                );
              } else {
                onDismissedSeq(data?.dismissed_seq ?? null);
              }
            });
        };
        reload();
      },
      () => reload(),
      { loadBeforeJoin: true },
    );
  }

  // Records moves a reader found that nobody chose. `linkedPlaysets` is the
  // get_world_playsets() result the moves were worked out from, exactly as
  // read; if it is out of date nothing is recorded. Returns how many applied.
  public static async recordChanges(
    worldId: string,
    changes: WorldOracleChangeInputDTO[],
    linkedPlaysets: unknown,
  ): Promise<number> {
    const { data, error, status } = await supabase.rpc(
      "record_world_oracle_changes",
      {
        p_world_id: worldId,
        p_changes: changes as never,
        p_playsets: linkedPlaysets as never,
      },
    );
    if (error) {
      console.error(error);
      throw getRepositoryError(
        error,
        ErrorVerb.Update,
        ErrorNoun.WorldOracleChange,
        true,
        status,
      );
    }
    return data ?? 0;
  }

  public static async resolveChange(
    changeId: string,
    keepPrevious: boolean,
  ): Promise<boolean> {
    const { data, error, status } = await supabase.rpc(
      "resolve_world_oracle_change",
      { p_change_id: changeId, p_keep_previous: keepPrevious },
    );
    if (error) {
      console.error(error);
      throw getRepositoryError(
        error,
        ErrorVerb.Update,
        ErrorNoun.WorldOracleChange,
        false,
        status,
      );
    }
    return !!data;
  }

  public static async dismissChanges(
    gameId: string,
    throughSeq: number,
  ): Promise<void> {
    const { error, status } = await supabase.rpc(
      "dismiss_world_oracle_changes",
      { p_game_id: gameId, p_seq: throughSeq },
    );
    if (error) {
      console.error(error);
      throw getRepositoryError(
        error,
        ErrorVerb.Update,
        ErrorNoun.WorldOracleChange,
        true,
        status,
      );
    }
  }
}
