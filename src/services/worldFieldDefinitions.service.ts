import { v4 as uuid } from "uuid";

import { Json } from "types/supabase-generated.type";
import {
  WorldFieldType,
  type IWorldFieldDefinition,
  type OracleBinding,
} from "types/worldField.type";

import {
  WorldFieldConfiguration,
  createWorldFieldConfiguration,
  generateWorldFieldKey,
  normalizeWorldFieldConfiguration,
} from "lib/worldFieldRules";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import type { DefaultWorldFieldBinding } from "repositories/worldConfiguration.repository";
import {
  WorldFieldDefinitionDTO,
  WorldFieldDefinitionsRepository,
} from "repositories/worldFieldDefinitions.repository";

export { WorldFieldType } from "types/worldField.type";
export type { IWorldFieldDefinition, OracleBinding } from "types/worldField.type";

export class WorldFieldDefinitionsService {
  public static listenToWorldFieldDefinitions(
    worldId: string,
    onDefinitionChanges: (
      changedDefinitions: Record<string, IWorldFieldDefinition>,
      removedDefinitionIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    return WorldFieldDefinitionsRepository.listenToWorldFieldDefinitions(
      worldId,
      (changedDefinitions, removedDefinitionIds, replaceState) =>
        onDefinitionChanges(
          Object.fromEntries(
            Object.entries(changedDefinitions).map(
              ([definitionId, definition]) => [
                definitionId,
                this.convertDefinitionDTOToDefinition(definition),
              ],
            ),
          ),
          removedDefinitionIds,
          replaceState,
        ),
      onError,
    );
  }

  public static addWorldFieldDefinition(
    worldId: string,
    categoryId: string,
    definition: {
      id?: string;
      key?: string;
      label: string;
      type: WorldFieldType;
      binding?: OracleBinding | null;
      configuration?: WorldFieldConfiguration;
      gmOnly?: boolean;
      sortOrder: number;
    },
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<string> {
    const id = definition.id ?? uuid();
    return WorldFieldDefinitionsRepository.addWorldFieldDefinition(
      {
        id,
        world_id: worldId,
        category_id: categoryId,
        key: definition.key ?? generateWorldFieldKey(id),
        label: definition.label,
        type: definition.type,
        binding: (definition.binding ?? null) as unknown as Json,
        configuration: (definition.configuration ??
          createWorldFieldConfiguration()) as unknown as Json,
        gm_only: definition.gmOnly ?? false,
        sort_order: definition.sortOrder,
      },
      defaultBindings,
    );
  }

  public static updateWorldFieldDefinition(
    worldId: string,
    definitionId: string,
    definition: Partial<
      Omit<IWorldFieldDefinition, "id" | "worldId" | "categoryId">
    >,
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return WorldFieldDefinitionsRepository.updateWorldFieldDefinition(
      worldId,
      definitionId,
      {
        label: definition.label,
        type: definition.type,
        binding:
          definition.binding === undefined
            ? undefined
            : (definition.binding as unknown as Json),
        configuration:
          definition.configuration === undefined
            ? undefined
            : (definition.configuration as unknown as Json),
        gm_only: definition.gmOnly,
        sort_order: definition.sortOrder,
      },
      defaultBindings,
    );
  }

  public static deleteWorldFieldDefinition(
    worldId: string,
    definitionId: string,
    defaultBindings?: DefaultWorldFieldBinding[],
  ): Promise<void> {
    return WorldFieldDefinitionsRepository.deleteWorldFieldDefinition(
      worldId,
      definitionId,
      defaultBindings,
    );
  }

  private static convertDefinitionDTOToDefinition(
    definition: WorldFieldDefinitionDTO,
  ): IWorldFieldDefinition {
    let type: WorldFieldType;
    switch (definition.type) {
      case "richText":
        type = WorldFieldType.RichText;
        break;
      case "oracleText":
        type = WorldFieldType.OracleText;
        break;
      case "tags":
        type = WorldFieldType.Tags;
        break;
      case "number":
        type = WorldFieldType.Number;
        break;
      case "categorySelect":
        type = WorldFieldType.CategorySelect;
        break;
      case "categoryMultiSelect":
        type = WorldFieldType.CategoryMultiSelect;
        break;
      default:
        type = WorldFieldType.Text;
    }

    return {
      id: definition.id,
      categoryId: definition.category_id,
      worldId: definition.world_id,
      key: definition.key,
      label: definition.label,
      type,
      binding: (definition.binding as unknown as OracleBinding) ?? null,
      configuration: normalizeWorldFieldConfiguration(definition.configuration),
      gmOnly: definition.gm_only,
      sortOrder: definition.sort_order,
    };
  }
}
