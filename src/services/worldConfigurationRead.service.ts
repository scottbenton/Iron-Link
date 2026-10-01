import type { IconDefinition } from "types/Icon.type";

import { normalizeWorldFieldConfiguration } from "lib/worldFieldRules";

import {
  WorldConfigurationReadRepository,
  type WorldConfigurationSnapshotDTO,
} from "repositories/worldConfigurationRead.repository";

import type { IWorldCategory } from "./worldCategories.service";
import {
  type IWorldFieldDefinition,
  type OracleBinding,
  WorldFieldType,
} from "./worldFieldDefinitions.service";

export interface WorldConfigurationSnapshot {
  configurationCustomized: boolean;
  categories: Record<string, IWorldCategory>;
  fieldDefinitions: Record<string, IWorldFieldDefinition>;
}

export class WorldConfigurationReadService {
  public static async getWorldConfiguration(
    worldId: string,
  ): Promise<WorldConfigurationSnapshot> {
    const snapshot =
      await WorldConfigurationReadRepository.getWorldConfiguration(worldId);
    return this.mapSnapshot(snapshot);
  }

  private static mapSnapshot(
    snapshot: WorldConfigurationSnapshotDTO,
  ): WorldConfigurationSnapshot {
    return {
      configurationCustomized: snapshot.configuration_customized,
      categories: Object.fromEntries(
        snapshot.categories.map((category) => [
          category.id,
          {
            id: category.id,
            worldId: category.world_id,
            name: category.name,
            icon: (category.icon as unknown as IconDefinition) ?? null,
            sortOrder: category.sort_order,
            supportsHierarchy: category.supports_hierarchy,
            supportsMap: category.supports_map,
            supportsBonds: category.supports_bonds,
            subtitleFieldDefinitionId: category.subtitle_field_definition_id,
          },
        ]),
      ),
      fieldDefinitions: Object.fromEntries(
        snapshot.field_definitions.map((field) => [
          field.id,
          {
            id: field.id,
            worldId: field.world_id,
            categoryId: field.category_id,
            key: field.key,
            label: field.label,
            type: field.type as WorldFieldType,
            binding: (field.binding as unknown as OracleBinding) ?? null,
            configuration: normalizeWorldFieldConfiguration(
              field.configuration,
            ),
            gmOnly: field.gm_only,
            sortOrder: field.sort_order,
          },
        ]),
      ),
    };
  }
}
