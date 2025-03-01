import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase.lib";

import {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/types/supabase-generated.type";

import { createSubscription } from "./_subscriptionManager";
import {
  ErrorNoun,
  ErrorVerb,
  getRepositoryError,
  RepositoryError,
} from "./errors/RepositoryErrors";

export type AssetDTO = Tables<"assets">;
type InsertAssetDTO = TablesInsert<"assets">;
type UpdateAssetDTO = TablesUpdate<"assets">;

export class AssetRepository {
  public static assets = () => supabase.from("assets");

  public static async createAsset(assetDTO: InsertAssetDTO): Promise<string> {
    const { data, error, status } = await this.assets()
      .insert(assetDTO)
      .select()
      .single();
    if (error) {
      console.error(error);
      throw getRepositoryError(
        error,
        ErrorVerb.Create,
        ErrorNoun.Asset,
        false,
        status,
      );
    }
    return data.id;
  }

  public static listenToAssets(
    gameId: string,
    characterIds: string[],
    onAssets: (
      assets: Record<string, AssetDTO>,
      deletedAssetIds: string[],
      replaceState: boolean,
    ) => void,
    onError: (error: RepositoryError) => void,
  ): () => void {
    const loadInitialAssets = () => {
      this.assets()
        .select()
        .or(
          `game_id.eq.${gameId}, character_id.in.("${
            characterIds.join('","')
          }")`,
        )
        .then((result) => {
          if (result.error) {
            console.error(result.error);
            onError(
              getRepositoryError(
                result.error,
                ErrorVerb.Read,
                ErrorNoun.Asset,
                true,
                result.status,
              ),
            );
          } else {
            const assets: Record<string, AssetDTO> = {};
            result.data?.forEach((asset) => {
              assets[asset.id] = asset;
            });
            onAssets(assets, [], true);
          }
        });
    };

    const handlePayload: (
      payload: RealtimePostgresChangesPayload<AssetDTO>,
    ) => void = (payload) => {
      if (payload.errors) {
        console.error(payload.errors);
        onError(
          getRepositoryError(
            payload.errors,
            ErrorVerb.Read,
            ErrorNoun.Asset,
            true,
          ),
        );
      }
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        onAssets({ [payload.new.id]: payload.new }, [], false);
      } else if (payload.eventType === "DELETE" && payload.old.id) {
        onAssets({}, [payload.old.id], false);
      } else {
        onError(
          getRepositoryError(
            "Unknown event type",
            ErrorVerb.Read,
            ErrorNoun.Asset,
            true,
          ),
        );
      }
    };

    const unsubscribe = createSubscription<AssetDTO>(
      `assets:game_id=${gameId}`,
      "assets",
      [`game_id=eq.${gameId}`, `character_id=in.(${characterIds.join(",")})`],
      loadInitialAssets,
      handlePayload,
    );

    return () => {
      unsubscribe();
    };
  }

  public static deleteAsset(assetId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.assets()
        .delete()
        .eq("id", assetId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Delete,
                ErrorNoun.Asset,
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

  public static updateAsset(
    assetId: string,
    assetDTO: UpdateAssetDTO,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.assets()
        .update(assetDTO)
        .eq("id", assetId)
        .then(({ error, status }) => {
          if (error) {
            console.error(error);
            reject(
              getRepositoryError(
                error,
                ErrorVerb.Update,
                ErrorNoun.Asset,
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
}
