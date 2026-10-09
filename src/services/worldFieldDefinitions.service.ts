import { v4 as uuid } from "uuid";

import { Json } from "types/supabase-generated.type";
import {
  type IWorldFieldDefinition,
  type OracleBinding,
  WorldFieldType,
} from "types/worldField.type";

import {
  WorldFieldConfiguration,
  createWorldFieldConfiguration,
  generateWorldFieldKey,
  normalizeWorldFieldConfiguration,
} from "lib/worldFieldRules";

import type {
  DefaultWorldFieldBindingDTO,
  WorldConfigurationFieldDTO,
} from "repositories/worldConfiguration.repository";
import { WorldFieldDefinitionsRepository } from "repositories/worldFieldDefinitions.repository";

export { WorldFieldType } from "types/worldField.type";
export type {
  IWorldFieldDefinition,
  OracleBinding,
} from "types/worldField.type";

export class WorldFieldDefinitionsService {
  public static async addWorldFieldDefinition(
    worldId: string,
    categoryId: string,
    definition: {
      label: string;
      type: WorldFieldType;
      binding?: OracleBinding | null;
      configuration?: WorldFieldConfiguration;
      gmOnly?: boolean;
      sortOrder: number;
    },
    inheritedFieldDefinitions?: IWorldFieldDefinition[],
  ): Promise<string> {
    const id = uuid();
    await WorldFieldDefinitionsRepository.addWorldFieldDefinition(
      worldId,
      categoryId,
      {
        id,
        // User fields get a stable key tied to their identity, never their
        // label, so renaming or reusing a label cannot collide.
        key: generateWorldFieldKey(id),
        label: definition.label,
        type: definition.type,
        binding: (definition.binding ?? null) as unknown as Json,
        configuration: (definition.configuration ??
          createWorldFieldConfiguration()) as unknown as Json,
        gm_only: definition.gmOnly ?? false,
        sort_order: definition.sortOrder,
      },
      this.convertInheritedBindingsToDTO(inheritedFieldDefinitions),
    );
    return id;
  }

  public static updateWorldFieldDefinition(
    worldId: string,
    definitionId: string,
    definition: Partial<
      Omit<IWorldFieldDefinition, "id" | "worldId" | "categoryId" | "key">
    >,
    inheritedFieldDefinitions?: IWorldFieldDefinition[],
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
      this.convertInheritedBindingsToDTO(inheritedFieldDefinitions),
    );
  }

  public static deleteWorldFieldDefinition(
    worldId: string,
    definitionId: string,
    inheritedFieldDefinitions?: IWorldFieldDefinition[],
  ): Promise<void> {
    return WorldFieldDefinitionsRepository.deleteWorldFieldDefinition(
      worldId,
      definitionId,
      this.convertInheritedBindingsToDTO(inheritedFieldDefinitions),
    );
  }

  public static reorderWorldFieldDefinitions(
    worldId: string,
    categoryId: string,
    definitionIds: string[],
    inheritedFieldDefinitions?: IWorldFieldDefinition[],
  ): Promise<void> {
    return WorldFieldDefinitionsRepository.reorderWorldFieldDefinitions(
      worldId,
      categoryId,
      definitionIds,
      this.convertInheritedBindingsToDTO(inheritedFieldDefinitions),
    );
  }

  // While a world inherits its defaults, the first edit copies them with the
  // bindings as they currently resolve. Only rules that override the oracle
  // carry a binding of their own.
  public static convertInheritedBindingsToDTO(
    inheritedFieldDefinitions: IWorldFieldDefinition[] | undefined,
  ): DefaultWorldFieldBindingDTO[] | undefined {
    return inheritedFieldDefinitions?.map((field) => ({
      id: field.id,
      binding: field.binding,
      rule_bindings: field.configuration.rules.flatMap((rule, index) =>
        rule.binding === undefined
          ? []
          : [{ index, binding: rule.binding, conditions: rule.conditions }],
      ),
    }));
  }

  public static convertDefinitionDTOToDefinition(
    definition: WorldConfigurationFieldDTO,
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
