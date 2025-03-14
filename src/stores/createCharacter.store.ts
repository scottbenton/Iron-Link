import { i18n } from "@/lib/i18n";
import { AssetService, IAsset } from "@/services/asset.service";
import { CharacterService } from "@/services/character.service";
import deepEqual from "fast-deep-equal";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

export interface CharacterPortraitSettings {
  image: File | null;
  position: { x: number; y: number };
  scale: number;
}

export type IAssetWithoutAdditives = Omit<
  IAsset,
  "id" | "characterId" | "gameId"
>;

interface CreateCharacterState {
  characterName: string;
  portrait: CharacterPortraitSettings;
  stats: Record<string, number>;
  characterAssets: IAssetWithoutAdditives[];
  gameAssets: IAssetWithoutAdditives[];
  error: string | null;
}

interface CreateCharacterActions {
  setCharacterName: (name: string) => void;
  setPortraitSettings: (settings: CharacterPortraitSettings) => void;
  setStat: (stat: string, value: number) => void;
  addAsset: (
    asset: Omit<IAssetWithoutAdditives, "order">,
    shared: boolean,
  ) => void;
  toggleAssetAbility: (
    index: number,
    abilityIndex: number,
    checked: boolean,
    shared: boolean,
  ) => void;
  updateAssetControl: (
    index: number,
    controlKey: string,
    value: string | boolean | number,
    shared: boolean,
  ) => void;
  updateAssetOption: (
    index: number,
    optionKey: string,
    value: string,
    shared: boolean,
  ) => void;
  removeAsset: (index: number, shared: boolean) => void;
  createCharacter: (gameId: string, uid: string) => Promise<string>;
  reset: () => void;
}

const defaultCreateCharacterState: CreateCharacterState = {
  characterName: "",
  portrait: {
    image: null,
    scale: 1,
    position: { x: 0, y: 0 },
  },
  stats: {},
  characterAssets: [],
  gameAssets: [],
  error: null,
};

export const useCreateCharacterStore = createWithEqualityFn<
  CreateCharacterState & CreateCharacterActions
>()(
  immer((set, getState) => ({
    ...defaultCreateCharacterState,

    setCharacterName: (name: string) => {
      set((state) => {
        state.characterName = name;
      });
    },
    setPortraitSettings: (settings) => {
      set((state) => {
        state.portrait = settings;
      });
    },
    setStat: (stat: string, value: number) => {
      set((state) => {
        state.stats[stat] = value;
      });
    },
    addAsset: (asset, shared) => {
      set((state) => {
        const orderedAssets = (
          shared ? state.gameAssets : state.characterAssets
        ).sort((a, b) => a.order - b.order);
        const newAssetOrder =
          orderedAssets.length > 0
            ? orderedAssets[orderedAssets.length - 1].order + 1
            : 0;
        const newAsset = { ...asset, order: newAssetOrder + 1 };
        if (shared) {
          state.gameAssets.push(newAsset);
        } else {
          state.characterAssets.push(newAsset);
        }
      });
    },
    toggleAssetAbility: (index, abilityIndex, checked, shared) => {
      set((store) => {
        const assets = shared ? store.gameAssets : store.characterAssets;
        assets[index].enabledAbilities[abilityIndex] = checked;
      });
    },
    updateAssetControl: (
      index: number,
      controlKey: string,
      value: string | boolean | number,
      shared: boolean,
    ) => {
      set((state) => {
        const assets = shared ? state.gameAssets : state.characterAssets;
        const newAsset = { ...assets[index] };
        if (!newAsset.controlValues) {
          newAsset.controlValues = {};
        }
        newAsset.controlValues[controlKey] = value;
        assets[index] = newAsset;
      });
    },

    updateAssetOption: (
      index: number,
      optionKey: string,
      value: string,
      shared: boolean,
    ) => {
      set((state) => {
        const assets = shared ? state.gameAssets : state.characterAssets;
        const newAsset = { ...assets[index] };
        if (!newAsset.optionValues) {
          newAsset.optionValues = {};
        }
        newAsset.optionValues[optionKey] = value;
        assets[index] = newAsset;
      });
    },
    removeAsset: (index, shared) => {
      set((state) => {
        const assets = shared ? state.gameAssets : state.characterAssets;
        assets.splice(index, 1);
      });
    },
    createCharacter: async (gameId, uid) => {
      const { characterName, portrait, stats, characterAssets, gameAssets } =
        getState();

      if (!characterName) {
        set((state) => {
          state.error = i18n.t(
            "character.no-name-entered-error",
            "Please enter a name",
          );
        });
        throw new Error("No name entered");
      }

      const characterId = await CharacterService.createCharacterAndAddToGame({
        uid,
        gameId,
        name: characterName,
        stats,
        profileImage: portrait,
      });

      const gameAssetPromises = gameAssets.map((gameAsset) =>
        AssetService.createAsset({
          ...gameAsset,
          gameId,
          characterId: characterId,
        }),
      );
      const characterAssetPromises = characterAssets.map((characterAsset) =>
        AssetService.createAsset({
          ...characterAsset,
          gameId: null,
          characterId,
        }),
      );

      await Promise.all([...gameAssetPromises, ...characterAssetPromises]);

      return characterId;
    },

    reset: () => {
      set((state) => {
        state.characterName = defaultCreateCharacterState.characterName;
        state.portrait = defaultCreateCharacterState.portrait;
        state.stats = defaultCreateCharacterState.stats;
        state.characterAssets = defaultCreateCharacterState.characterAssets;
        state.gameAssets = defaultCreateCharacterState.gameAssets;
        state.error = null;
      });
    },
  })),
  deepEqual,
);
