import { AssetDTO, AssetRepository } from "repositories/asset.repository";
import { RepositoryError } from "repositories/errors/RepositoryErrors";

export type IAsset = {
  id: string;
  characterId: string | null;
  gameId: string | null;
  controlValues: Record<string, boolean | string | number>;
  dataswornAssetId: string;
  enabledAbilities: Record<number, boolean>;
  optionValues: Record<string, string>;
  order: number;
};

export class AssetService {
  public static async createAsset(
    partialAsset: Omit<IAsset, "id">,
  ): Promise<string> {
    return AssetRepository.createAsset({
      character_id: partialAsset.characterId,
      game_id: partialAsset.gameId,
      control_values: partialAsset.controlValues,
      datasworn_asset_id: partialAsset.dataswornAssetId,
      enabled_abilities: partialAsset.enabledAbilities,
      option_values: partialAsset.optionValues,
      order: partialAsset.order,
    });
  }

  public static listenToGameAssets(
    gameId: string,
    characterIds: string[],
    onAssets: (
      updatedAssets: Record<string, IAsset>,
      deletedAssetIds: string[],
    ) => void,
    onError: (error: RepositoryError) => void,
  ) {
    return AssetRepository.listenToAssets(
      gameId,
      characterIds,
      (assets, deletedAssetIds) => {
        onAssets(
          Object.fromEntries(
            Object.entries(assets).map(([id, asset]) => [
              id,
              this.convertAssetDTOToAsset(asset),
            ]),
          ),
          deletedAssetIds,
        );
      },
      onError,
    );
  }

  public static async updateAssetAbilities(
    assetId: string,
    assetAbilities: Record<number, boolean>,
  ) {
    return AssetRepository.updateAsset(assetId, {
      enabled_abilities: assetAbilities,
    });
  }

  public static async updateAssetOption(
    assetId: string,
    assetOptionValues: Record<string, string>,
  ): Promise<void> {
    return AssetRepository.updateAsset(assetId, {
      option_values: assetOptionValues,
    });
  }

  public static async updateAssetControl(
    assetId: string,
    assetControlValues: Record<string, boolean | string | number>,
  ): Promise<void> {
    return AssetRepository.updateAsset(assetId, {
      control_values: assetControlValues,
    });
  }

  public static async deleteAsset(assetId: string): Promise<void> {
    return AssetRepository.deleteAsset(assetId);
  }

  private static convertAssetDTOToAsset(assetDTO: AssetDTO): IAsset {
    return {
      id: assetDTO.id,
      characterId: assetDTO.character_id,
      gameId: assetDTO.game_id,
      controlValues: assetDTO.control_values as Record<
        string,
        boolean | string | number
      >,
      dataswornAssetId: assetDTO.datasworn_asset_id,
      enabledAbilities: assetDTO.enabled_abilities as Record<string, boolean>,
      optionValues: assetDTO.option_values as Record<string, string>,
      order: assetDTO.order,
    };
  }
}
