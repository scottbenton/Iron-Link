import { Json } from "types/supabase-generated.type";

import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  OracleBindingDTO,
  WorldFieldDefinitionDTO,
  WorldFieldDefinitionsRepository,
} from "repositories/worldFieldDefinitions.repository";

// The stored JSON already uses the domain shape, so this is an alias rather
// than a conversion.
export type OracleBinding = OracleBindingDTO;

export enum WorldFieldType {
  Text = "text",
  RichText = "richText",
  OracleText = "oracleText",
  Tags = "tags",
  Number = "number",
}

export interface IWorldFieldDefinition {
  id: string;
  categoryId: string;
  worldId: string;
  // Stable import/export handle. Values point at `id`, so renaming a field's
  // label costs nothing and this only matters to the IF importer.
  key: string;
  label: string;
  type: WorldFieldType;
  binding: OracleBinding | null;
  // Mirrored onto every value row by a database trigger; flipping it here is
  // what moves existing values across the RLS boundary.
  gmOnly: boolean;
  sortOrder: number;
}

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
      key: string;
      label: string;
      type: WorldFieldType;
      binding?: OracleBinding;
      gmOnly?: boolean;
      sortOrder: number;
    },
  ): Promise<string> {
    return WorldFieldDefinitionsRepository.addWorldFieldDefinition({
      world_id: worldId,
      category_id: categoryId,
      key: definition.key,
      label: definition.label,
      type: definition.type,
      binding: (definition.binding ?? null) as unknown as Json,
      gm_only: definition.gmOnly ?? false,
      sort_order: definition.sortOrder,
    });
  }

  public static updateWorldFieldDefinition(
    definitionId: string,
    definition: Partial<
      Omit<IWorldFieldDefinition, "id" | "worldId" | "categoryId">
    >,
  ): Promise<void> {
    return WorldFieldDefinitionsRepository.updateWorldFieldDefinition(
      definitionId,
      {
        key: definition.key,
        label: definition.label,
        type: definition.type,
        binding:
          definition.binding === undefined
            ? undefined
            : (definition.binding as unknown as Json),
        gm_only: definition.gmOnly,
        sort_order: definition.sortOrder,
      },
    );
  }

  public static deleteWorldFieldDefinition(
    definitionId: string,
  ): Promise<void> {
    return WorldFieldDefinitionsRepository.deleteWorldFieldDefinition(
      definitionId,
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
      gmOnly: definition.gm_only,
      sortOrder: definition.sort_order,
    };
  }
}
