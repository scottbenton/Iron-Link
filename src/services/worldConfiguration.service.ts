import { RepositoryError } from "repositories/errors/RepositoryErrors";
import {
  WorldCategoryCountsDTO,
  WorldConfigurationDTO,
  WorldConfigurationRepository,
  WorldConfigurationSubscription,
} from "repositories/worldConfiguration.repository";

import {
  IWorldCategory,
  WorldCategoriesService,
} from "./worldCategories.service";
import {
  IWorldFieldDefinition,
  WorldFieldDefinitionsService,
} from "./worldFieldDefinitions.service";

export interface IWorldConfiguration {
  // False while the world inherits its setting's defaults. The first edit
  // copies them into the world and flips this for good.
  configurationCustomized: boolean;
  categories: Record<string, IWorldCategory>;
  fieldDefinitions: Record<string, IWorldFieldDefinition>;
}

export type IWorldCategoryCounts = WorldCategoryCountsDTO;

export class WorldConfigurationService {
  public static listenToWorldConfiguration(
    worldId: string,
    onConfiguration: (configuration: IWorldConfiguration) => void,
    onError: (error: RepositoryError) => void,
  ): WorldConfigurationSubscription {
    return WorldConfigurationRepository.listenToWorldConfiguration(
      worldId,
      (configuration) =>
        onConfiguration(this.convertConfigurationDTO(configuration)),
      onError,
    );
  }

  public static getCategoryCounts(
    worldId: string,
    categoryId: string,
  ): Promise<IWorldCategoryCounts> {
    return WorldConfigurationRepository.getCategoryCounts(worldId, categoryId);
  }

  private static convertConfigurationDTO(
    configuration: WorldConfigurationDTO,
  ): IWorldConfiguration {
    return {
      configurationCustomized: configuration.configuration_customized,
      categories: Object.fromEntries(
        configuration.categories.map((category) => [
          category.id,
          WorldCategoriesService.convertWorldCategoryDTOToWorldCategory(
            category,
          ),
        ]),
      ),
      fieldDefinitions: Object.fromEntries(
        configuration.field_definitions.map((definition) => [
          definition.id,
          WorldFieldDefinitionsService.convertDefinitionDTOToDefinition(
            definition,
          ),
        ]),
      ),
    };
  }
}
