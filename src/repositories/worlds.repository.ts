import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { Tables, TablesUpdate } from "types/supabase-generated.type";

import { supabase } from "lib/supabase.lib";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";
import { WorldPermission } from "./shared.types";
import type { WorldOracleChangeInputDTO } from "./worldOracleChanges.repository";

// Everything except the Notes: notes_content is a large Yjs byte column
// fetched on demand (as entries leave out theirs), with its own version.
const WORLD_COLUMNS =
  "id, name, setting_key, configuration_customized, created_by, created_at, updated_at";

export type WorldDTO = Omit<
  Tables<"worlds">,
  "notes_content" | "notes_updated_at"
>;
export type WorldUpdateDTO = TablesUpdate<"worlds">;

// The roles an explicit world_players row can hold. Deliberately narrower
// than WorldPermission, which also covers the guide/player roles derived
// live from linked games -- those never appear in world_players.
export type WorldMembershipRole = "owner" | "editor" | "viewer";

// A world plus how the user reaches it: an explicit membership role, or
// null when the world is only reachable through a linked game. Resolving
// the derived case to a concrete role would mean a world_role() RPC per
// world; callers that need it can ask for a single world's permission.
export interface WorldWithRoleDTO {
  world: WorldDTO;
  role: WorldMembershipRole | null;
}

// Returned by link_game_to_world(): how many of the save dialog's oracle
// choices applied (a choice whose field moved meanwhile is skipped).
export interface WorldLinkResult {
  appliedOracleChanges: number;
}

// A save dialog choice for link_game_to_world(), which also takes choices for
// the world a game leaves when it moves to another, so each names its world.
export interface WorldLinkOracleChangeDTO extends WorldOracleChangeInputDTO {
  worldId: string;
}

export class WorldsRepository {
  private static worlds = () => supabase.from("worlds");

  public static async getWorld(worldId: string): Promise<WorldDTO> {
    const { data, error, status } = await this.worlds()
      .select(WORLD_COLUMNS)
      .eq("id", worldId)
      .single();

    if (error) {
      throw getRepositoryError(
        error,
        ErrorVerb.Read,
        ErrorNoun.World,
        false,
        status,
      );
    }

    return data;
  }

  public static listenToWorld(
    worldId: string,
    onWorld: (world: WorldDTO) => void,
    onWorldDeleted: () => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    const getInitialState = () => {
      this.getWorld(worldId).then(onWorld).catch(onError);
    };

    const handlePayload = (
      payload: RealtimePostgresChangesPayload<WorldDTO>,
    ) => {
      if (payload.errors) {
        console.error(payload.errors);
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.World,
            false,
          ),
        );
      } else if (
        payload.eventType === "INSERT" ||
        payload.eventType === "UPDATE"
      ) {
        onWorld(payload.new);
      } else if (payload.eventType === "DELETE") {
        onWorldDeleted();
      }
    };

    const unsubscribe = createSubscription(
      `worlds:id=eq.${worldId}`,
      "worlds",
      `id=eq.${worldId}`,
      getInitialState,
      handlePayload,
    );

    return () => {
      unsubscribe();
    };
  }

  // RLS would already limit a bare `select * from worlds` to the readable set,
  // but its predicate is a SECURITY DEFINER world_role() call, which Postgres
  // cannot inline -- an unfiltered select runs it once per world in the table.
  // Drive the query from the two membership sources instead (both indexed) so
  // the policy only has to confirm the handful of rows we already narrowed to.
  public static async getUsersWorlds(
    userId: string,
  ): Promise<WorldWithRoleDTO[]> {
    const [explicit, viaGames] = await Promise.all([
      supabase
        .from("world_players")
        .select(`role, worlds!inner(${WORLD_COLUMNS})`)
        .eq("user_id", userId),
      supabase
        .from("games")
        .select(`worlds!inner(${WORLD_COLUMNS}), game_players!inner(user_id)`)
        .eq("game_players.user_id", userId),
    ]);

    const failure = explicit.error ? explicit : viaGames;
    if (failure.error) {
      console.error(failure.error);
      throw getRepositoryError(
        failure.error,
        ErrorVerb.Read,
        ErrorNoun.World,
        true,
        failure.status,
      );
    }

    // A world reachable both ways shows up in both results; key by id. The
    // explicit membership row carries the role and is applied second so it
    // wins -- a world you own is not demoted to derived access just because
    // you also happen to play in a game linked to it.
    const worlds: Record<string, WorldWithRoleDTO> = {};
    (viaGames.data ?? []).forEach((row) => {
      worlds[row.worlds.id] = { world: row.worlds, role: null };
    });
    (explicit.data ?? []).forEach((row) => {
      worlds[row.worlds.id] = {
        world: row.worlds,
        role: row.role as WorldMembershipRole,
      };
    });
    return Object.values(worlds);
  }

  // Inserts the world and the creator's owner membership row atomically;
  // the world_players insert policy is owner-only, so the initial owner row
  // can only be created through this security-definer function.
  public static async createWorld(
    name: string,
    settingKey: string | null,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      supabase
        .rpc("create_world", {
          p_name: name,
          p_setting_key: settingKey ?? undefined,
        })
        .then(({ data, error, status }) => {
          if (error || !data) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Create,
                ErrorNoun.World,
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

  // Sets games.world_id. Clients hold no INSERT/UPDATE privilege on that
  // column (see 20260911000000_changes.sql) because writing it grants world
  // access to every member of the game, so this RPC is the only way in. It
  // enforces guide-on-the-game plus explicit owner/editor on the world.
  //
  // Linking can move what the world's fields roll; the oracle changes are the
  // save dialog's choices, applied in the same transaction.
  public static async linkGameToWorld(
    gameId: string,
    worldId: string,
    oracleChanges: WorldLinkOracleChangeDTO[] = [],
  ): Promise<WorldLinkResult> {
    const { data, error, status } = await supabase.rpc("link_game_to_world", {
      p_game_id: gameId,
      p_world_id: worldId,
      p_oracle_changes: oracleChanges as never,
    });

    if (error) {
      console.error(error);
      throw getRepositoryError(
        error,
        ErrorVerb.Update,
        ErrorNoun.World,
        false,
        status,
      );
    }

    return (data ?? { appliedOracleChanges: 0 }) as unknown as WorldLinkResult;
  }

  // Clears games.world_id. Guide-on-the-game only: unlinking removes an
  // audience from the world rather than adding one, so it needs no rights on
  // the world itself. Oracle choices do, and a game's Guide has them until
  // the unlink.
  public static async unlinkGameFromWorld(
    gameId: string,
    oracleChanges: WorldOracleChangeInputDTO[] = [],
  ): Promise<void> {
    const { error, status } = await supabase.rpc("unlink_game_from_world", {
      p_game_id: gameId,
      p_oracle_changes: oracleChanges as never,
    });

    if (error) {
      console.error(error);
      throw getRepositoryError(
        error,
        ErrorVerb.Update,
        ErrorNoun.World,
        false,
        status,
      );
    }
  }

  // Powers the delete-world confirmation, which names how many games get
  // unlinked -- games.world_id is ON DELETE SET NULL, so the damage is
  // otherwise invisible to the person doing it.
  public static async countGamesLinkedToWorld(
    worldId: string,
  ): Promise<number> {
    const { count, error, status } = await supabase
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("world_id", worldId);

    if (error) {
      console.error(error);
      throw getRepositoryError(
        error,
        ErrorVerb.Read,
        ErrorNoun.Game,
        true,
        status,
      );
    }

    return count ?? 0;
  }

  public static async updateWorld(
    worldId: string,
    world: WorldUpdateDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worlds()
        .update(world)
        .eq("id", worldId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.World,
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

  public static async deleteWorld(worldId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.worlds()
        .delete()
        .eq("id", worldId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Delete,
                ErrorNoun.World,
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

  // Whether anyone in the world has less than Guide access. Never says who.
  public static async getWorldIsGuided(worldId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      supabase
        .rpc("world_is_guided", { p_world_id: worldId })
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.World,
                false,
                status,
              ),
            );
          } else {
            resolve(data === true);
          }
        });
    });
  }

  public static async getWorldNotesContent(
    worldId: string,
  ): Promise<string | null> {
    const { data, error, status } = await this.worlds()
      .select("notes_content")
      .eq("id", worldId)
      .single();
    if (error) {
      console.error(error);
      throw getRepositoryError(
        error,
        ErrorVerb.Read,
        ErrorNoun.World,
        false,
        status,
      );
    }
    return data.notes_content;
  }

  public static async getWorldPermission(
    worldId: string,
    userId: string,
  ): Promise<WorldPermission> {
    return new Promise((resolve, reject) => {
      supabase
        .rpc("world_role", { p_world_id: worldId, p_uid: userId })
        .then(({ data, error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Read,
                ErrorNoun.World,
                false,
                status,
              ),
            );
          } else {
            const permissions = Object.values(WorldPermission) as string[];
            resolve(
              data && permissions.includes(data)
                ? (data as WorldPermission)
                : WorldPermission.None,
            );
          }
        });
    });
  }
}
