import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "types/supabase-generated.type";

import { ErrorNoun } from "./errors/RepositoryErrors";
import {
  type DefaultWorldFieldBinding,
  WorldConfigurationRepository,
} from "./worldConfiguration.repository";

export type WorldFieldDefinitionDTO = Tables<"world_field_definitions">;
export type WorldFieldDefinitionInsertDTO =
  TablesInsert<"world_field_definitions">;
export type WorldFieldDefinitionUpdateDTO =
  TablesUpdate<"world_field_definitions">;

// Field definitions are read as part of the world configuration. Every edit
// goes through the configuration RPC so the first one can fork defaults.
export class WorldFieldDefinitionsRepository {
  public static addWorldFieldDefinition(
    worldId: string,
    categoryId: string,
    definition: Omit<
      WorldFieldDefinitionInsertDTO,
      "world_id" | "category_id"
    > &
      Required<Pick<WorldFieldDefinitionInsertDTO, "id" | "configuration">>,
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return WorldConfigurationRepository.mutateWorldConfiguration(
      worldId,
      {
        type: "create_field",
        category_id: categoryId,
        field: {
          id: definition.id,
          key: definition.key,
          label: definition.label,
          type: definition.type,
          binding: definition.binding ?? null,
          configuration: definition.configuration,
          gm_only: definition.gm_only ?? false,
          sort_order: definition.sort_order ?? 0,
        },
      },
      ErrorNoun.WorldFieldDefinition,
      defaultBindings,
    );
  }

  // Changing gm_only moves existing values across the RLS boundary: a trigger
  // copies it onto every value row for this definition in the same statement.
  public static updateWorldFieldDefinition(
    worldId: string,
    definitionId: string,
    definition: WorldFieldDefinitionUpdateDTO,
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return WorldConfigurationRepository.mutateWorldConfiguration(
      worldId,
      { type: "update_field", id: definitionId, changes: definition },
      ErrorNoun.WorldFieldDefinition,
      defaultBindings,
    );
  }

  // Cascades to every value row for this definition.
  public static deleteWorldFieldDefinition(
    worldId: string,
    definitionId: string,
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return WorldConfigurationRepository.mutateWorldConfiguration(
      worldId,
      { type: "delete_field", id: definitionId },
      ErrorNoun.WorldFieldDefinition,
      defaultBindings,
    );
  }

  public static reorderWorldFieldDefinitions(
    worldId: string,
    categoryId: string,
    definitionIds: string[],
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return WorldConfigurationRepository.mutateWorldConfiguration(
      worldId,
      { type: "reorder_fields", category_id: categoryId, ids: definitionIds },
      ErrorNoun.WorldFieldDefinition,
      defaultBindings,
    );
  }
}
