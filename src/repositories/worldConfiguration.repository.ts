import type { Json } from "types/supabase-generated.type";
import type { OracleBinding, WorldFieldCondition } from "types/worldField.type";

import { supabase } from "lib/supabase.lib";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  RepositoryError,
  getRepositoryError,
} from "./errors/RepositoryErrors";
import type {
  WorldCategoryDTO,
  WorldCategoryUpdateDTO,
} from "./worldCategories.repository";
import type {
  WorldFieldDefinitionDTO,
  WorldFieldDefinitionUpdateDTO,
} from "./worldFieldDefinitions.repository";

type Timestamps = "created_at" | "updated_at";
export type WorldConfigurationCategoryDTO = Omit<WorldCategoryDTO, Timestamps>;
export type WorldConfigurationFieldDTO = Omit<
  WorldFieldDefinitionDTO,
  Timestamps
>;

// The effective configuration: the setting's defaults while the world still
// inherits them, or its own rows once customized.
export interface WorldConfigurationDTO {
  configuration_customized: boolean;
  categories: WorldConfigurationCategoryDTO[];
  field_definitions: WorldConfigurationFieldDTO[];
}

export type WorldConfigurationOperation =
  | {
      type: "create_category";
      category: Omit<WorldConfigurationCategoryDTO, "world_id">;
    }
  | { type: "update_category"; id: string; changes: WorldCategoryUpdateDTO }
  | { type: "delete_category"; id: string }
  | { type: "reorder_categories"; ids: string[] }
  | {
      type: "create_field";
      category_id: string;
      field: Omit<WorldConfigurationFieldDTO, "world_id" | "category_id">;
    }
  | {
      type: "update_field";
      id: string;
      changes: WorldFieldDefinitionUpdateDTO;
    }
  | { type: "delete_field"; id: string }
  | { type: "reorder_fields"; category_id: string; ids: string[] };

// Inherited bindings resolve against the world's current playset, which only
// the client can compute. The first edit sends them so the copy pins them.
export interface DefaultWorldFieldBindingDTO {
  id: string;
  binding: OracleBinding | null;
  // Only rules that override the oracle. The server rejects the snapshot when
  // a rule's conditions no longer match its current defaults.
  rule_bindings: {
    index: number;
    binding: OracleBinding | null;
    conditions: WorldFieldCondition[];
  }[];
}

export interface WorldConfigurationSubscription {
  refresh: () => Promise<void>;
  unsubscribe: () => void;
}

export interface WorldCategoryCountsDTO {
  entryCount: number;
  valueCounts: Record<string, number>;
}

export class WorldConfigurationRepository {
  public static async getWorldConfiguration(
    worldId: string,
  ): Promise<WorldConfigurationDTO> {
    const { data, error, status } = await supabase.rpc(
      "get_world_configuration",
      { p_world_id: worldId },
    );
    if (error) {
      throw getRepositoryError(
        error,
        ErrorVerb.Read,
        ErrorNoun.WorldCategory,
        true,
        status,
      );
    }
    return data as unknown as WorldConfigurationDTO;
  }

  // Any category or field change invalidates the effective configuration,
  // which is simpler to re-read than to patch. Inherited worlds have no rows,
  // so their first edit shows up as the inserts that customize them.
  public static listenToWorldConfiguration(
    worldId: string,
    onConfiguration: (configuration: WorldConfigurationDTO) => void,
    onError: (error: RepositoryError) => void,
  ): WorldConfigurationSubscription {
    let active = true;
    let loading = false;
    let stale = false;
    let waiting: (() => void)[] = [];
    const settle = () => {
      const resolved = waiting;
      waiting = [];
      resolved.forEach((resolve) => resolve());
    };

    // One read at a time; changes during a read discard it and trigger
    // exactly one more, so an older read never overwrites a newer change.
    const load = () => {
      if (loading) {
        stale = true;
        return;
      }
      loading = true;
      stale = false;
      this.getWorldConfiguration(worldId)
        .then((configuration) => {
          if (active && !stale) {
            onConfiguration(configuration);
            settle();
          }
        })
        .catch((error) => {
          if (active && !stale) {
            onError(error);
            settle();
          }
        })
        .finally(() => {
          loading = false;
          if (active && stale) load();
        });
    };

    const handlePayload = (payload: { errors: unknown }) => {
      if (payload.errors) {
        console.error(payload.errors);
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.WorldCategory,
            true,
          ),
        );
      } else {
        load();
      }
    };

    const unsubscribeCategories = createSubscription(
      `world_categories:world_id=eq.${worldId}`,
      "world_categories",
      `world_id=eq.${worldId}`,
      load,
      handlePayload,
    );
    const unsubscribeFields = createSubscription(
      `world_field_definitions:world_id=eq.${worldId}`,
      "world_field_definitions",
      `world_id=eq.${worldId}`,
      () => {},
      handlePayload,
    );

    return {
      // Resolves once a read started after this call has been delivered.
      refresh: () =>
        new Promise<void>((resolve) => {
          if (!active) return resolve();
          waiting.push(resolve);
          load();
        }),
      unsubscribe: () => {
        active = false;
        settle();
        unsubscribeCategories();
        unsubscribeFields();
      },
    };
  }

  // The server forks the current defaults first if the world still inherits
  // them, and applies the edit in the same transaction.
  public static async mutateWorldConfiguration(
    worldId: string,
    operation: WorldConfigurationOperation,
    errorNoun: ErrorNoun,
    defaultBindings?: DefaultWorldFieldBindingDTO[],
  ): Promise<void> {
    const { error, status } = await supabase.rpc("mutate_world_configuration", {
      p_world_id: worldId,
      p_operation: operation as unknown as Json,
      p_default_bindings: defaultBindings as unknown as Json | undefined,
    });
    if (error) {
      throw getRepositoryError(
        error,
        ErrorVerb.Update,
        errorNoun,
        false,
        status,
      );
    }
  }

  public static async getCategoryCounts(
    worldId: string,
    categoryId: string,
  ): Promise<WorldCategoryCountsDTO> {
    const { data, error, status } = await supabase.rpc(
      "get_world_category_counts",
      { p_world_id: worldId, p_category_id: categoryId },
    );
    if (error) {
      throw getRepositoryError(
        error,
        ErrorVerb.Read,
        ErrorNoun.WorldCategory,
        false,
        status,
      );
    }
    const counts = data as unknown as WorldCategoryCountsDTO;
    return {
      entryCount: counts.entryCount,
      valueCounts: counts.valueCounts ?? {},
    };
  }
}
