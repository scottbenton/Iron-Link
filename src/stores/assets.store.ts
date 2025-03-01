import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";
import { AssetService, IAsset } from "@/services/asset.service";

import { useGameCharactersStore } from "./gameCharacters.store";

interface AssetsStoreState {
  loading: boolean;
  error: string | null;

  assets: Record<string, IAsset>;
}

interface AssetsStoreActions {
  listenToGameAssets: (gameId: string, characterIds: string[]) => () => void;

  addAsset: (asset: Omit<IAsset, "id">) => Promise<string>;
  toggleAssetAbility: (
    assetId: string,
    abilityIndex: number,
    checked: boolean,
  ) => Promise<void>;
  updateAssetOption: (
    assetId: string,
    assetOptionKey: string,
    value: string,
  ) => Promise<void>;
  updateAssetControl: (
    assetId: string,
    assetControlKey: string,
    value: string | boolean | number,
  ) => Promise<void>;
  deleteAsset: (assetId: string) => Promise<void>;

  reset: () => void;
}

const defaultState: AssetsStoreState = {
  assets: {},
  error: null,
  loading: true,
};

export const useAssetsStore = createWithEqualityFn<
  AssetsStoreState & AssetsStoreActions
>()(
  immer((set) => {
    return {
      ...defaultState,

      listenToGameAssets: (gameId, characterIds) => {
        return AssetService.listenToGameAssets(
          gameId,
          characterIds,
          (changedAssets, deletedAssets, replaceState) => {
            set((state) => {
              if (replaceState) {
                state.assets = changedAssets;
              } else {
                Object.entries(changedAssets).forEach(([id, asset]) => {
                  state.assets[id] = asset;
                });
                deletedAssets.forEach((id) => {
                  delete state.assets[id];
                });
              }
              state.error = null;
              state.loading = false;
            });
          },
          (error) => {
            set((state) => {
              state.loading = false;
              state.error = error.message;
            });
          },
        );
      },
      addAsset: (asset) => {
        return AssetService.createAsset(asset);
      },
      toggleAssetAbility: (assetId, abilityId, checked) => {
        return new Promise((resolve, reject) => {
          set((store) => {
            store.assets[assetId].enabledAbilities[abilityId] = checked;
            AssetService.updateAssetAbilities(
              assetId,
              store.assets[assetId].enabledAbilities,
            )
              .then(resolve)
              .catch(reject);
          });
        });
      },
      updateAssetOption: (assetId, assetOptionKey, value) => {
        return new Promise((resolve, reject) => {
          set((store) => {
            store.assets[assetId].optionValues[assetOptionKey] = value;
            AssetService.updateAssetOption(
              assetId,
              store.assets[assetId].optionValues,
            )
              .then(resolve)
              .catch(reject);
          });
        });
      },
      updateAssetControl: (assetId, assetControlKey, value) => {
        return new Promise((resolve, reject) => {
          set((store) => {
            store.assets[assetId].controlValues[assetControlKey] = value;
            AssetService.updateAssetControl(
              assetId,
              store.assets[assetId].controlValues,
            )
              .then(resolve)
              .catch(reject);
          });
        });
      },
      deleteAsset: (assetId) => {
        return AssetService.deleteAsset(assetId);
      },

      reset: () => {
        set(() => ({
          gameAssets: {},
          characterAssets: {},
          loading: false,
          error: null,
        }));
      },
    };
  }),
  deepEqual,
);

export function useListenToGameAssets(gameId: string | undefined) {
  // Todo - get listeners and reset function and call

  const listenToGameAssets = useAssetsStore(
    (store) => store.listenToGameAssets,
  );
  const reset = useAssetsStore((store) => store.reset);

  const characterIds = useGameCharactersStore((store) =>
    Object.keys(store.characters)
  );

  useEffect(() => {
    if (gameId) {
      const unsubscribe = listenToGameAssets(gameId, characterIds);
      return () => {
        unsubscribe();
        reset();
      };
    }
    return () => {
      reset();
    };
  }, [reset, listenToGameAssets, gameId, characterIds]);
}
