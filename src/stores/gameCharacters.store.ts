import equal from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";

import { InitiativeStatus } from "repositories/character.repository";
import { ColorScheme } from "repositories/shared.types";

import { CharacterService, ICharacter } from "services/character.service";

import { useUID } from "./auth.store";
import { GamePermission, useGameStore } from "./game.store";

export enum CharacterPermissionType {
  Owner = "owner",
  Guide = "guide",
  OtherPlayer = "other_player",
  Viewer = "viewer",
}

interface GameCharactersStoreState {
  characters: Record<string, ICharacter>;
  characterPermissions: Record<string, CharacterPermissionType>;
  loading: boolean;
  error?: string;
}

interface GameCharactersStoreActions {
  listenToGameCharacters: (gameId: string) => () => void;
  setCharacterPermissions: (
    characterPermissions: Record<string, CharacterPermissionType>,
  ) => void;

  updateCharacterPortrait: (
    characterId: string,
    scale: number,
    position: { x: number; y: number },
    newPortrait?: File,
  ) => Promise<void>;
  removeCharacterPortrait: (characterId: string) => Promise<void>;
  updateCharacterName: (characterId: string, newName: string) => Promise<void>;
  updateCharacterStats: (
    characterId: string,
    newStats: Record<string, number>,
  ) => Promise<void>;
  updateCharacterColorScheme: (
    characterId: string,
    colorScheme: ColorScheme | null,
  ) => Promise<void>;
  updateCharacterInitiativeStatus: (
    characterId: string,
    initiativeStatus: InitiativeStatus,
  ) => Promise<void>;
  updateCharacterConditionMeterValue: (
    characterId: string,
    conditionMeterId: string,
    newValue: number,
  ) => Promise<void>;
  updateCharacterMomentum: (
    characterId: string,
    momentum: number,
  ) => Promise<void>;
  updateCharacterAdds: (characterId: string, adds: number) => Promise<void>;
  updateCharacterImpactValue: (
    characterId: string,
    impactKey: string,
    checked: boolean,
  ) => Promise<void>;
  updateSpecialTrackValue: (
    characterId: string,
    specialTrackKey: string,
    value: number,
  ) => Promise<void>;
  updateExperience: (characterId: string, experience: number) => Promise<void>;
  deleteCharacter: (characterId: string) => Promise<void>;
}

const defaultState: GameCharactersStoreState = {
  characters: {},
  characterPermissions: {},
  loading: true,
};

export const useGameCharactersStore = createWithEqualityFn<
  GameCharactersStoreState & GameCharactersStoreActions
>()(
  immer((set, getState) => ({
    ...defaultState,
    listenToGameCharacters: (gameId: string) => {
      const unsubscribe = CharacterService.listenToGameCharacters(
        gameId,
        (changedCharacters, removedCharacterIds) => {
          set((store) => {
            store.loading = false;
            store.error = undefined;

            Object.entries(changedCharacters).forEach(([id, character]) => {
              store.characters[id] = character;
            });
            removedCharacterIds.forEach((id) => {
              delete store.characters[id];
            });
          });
        },
        (error) => {
          set((store) => {
            store.loading = false;
            store.error = error.message;
          });
        },
      );

      return () => {
        unsubscribe();
        set((store) => ({ ...store, ...defaultState }));
      };
    },
    setCharacterPermissions: (characterPermissions) => {
      set((store) => {
        store.characterPermissions = characterPermissions;
      });
    },

    updateCharacterName: (characterId: string, newName: string) => {
      return CharacterService.updateCharacterName(characterId, newName);
    },
    updateCharacterPortrait: (characterId, scale, position, newPortrait) => {
      const existingPortraitFileName =
        getState().characters[characterId]?.profileImage?.filename;
      return CharacterService.updateCharacterPortrait(
        characterId,
        scale,
        position,
        existingPortraitFileName,
        newPortrait,
      );
    },
    removeCharacterPortrait: (characterId: string) => {
      const existingPortraitFileName =
        getState().characters[characterId]?.profileImage?.filename;
      if (!existingPortraitFileName) {
        return Promise.resolve();
      }
      return CharacterService.removeCharacterPortrait(
        characterId,
        existingPortraitFileName,
      );
    },
    updateCharacterStats: (characterId, newStats) => {
      return CharacterService.updateCharacterStats(characterId, newStats);
    },
    updateCharacterColorScheme: (characterId, colorScheme) => {
      return CharacterService.updateCharacterColorScheme(
        characterId,
        colorScheme,
      );
    },
    updateCharacterInitiativeStatus: (characterId, initiativeStatus) => {
      return CharacterService.updateCharacterInitiativeStatus(
        characterId,
        initiativeStatus,
      );
    },
    updateCharacterConditionMeterValue: (
      characterId,
      conditionMeterId,
      value,
    ) => {
      return new Promise((resolve, reject) => {
        set((store) => {
          store.characters[characterId].conditionMeters[conditionMeterId] =
            value;
          CharacterService.updateConditionMeters(
            characterId,
            store.characters[characterId].conditionMeters,
          )
            .then(resolve)
            .catch(reject);
        });
      });
    },
    updateCharacterMomentum: (characterId, momentum) => {
      return CharacterService.updateMomentum(characterId, momentum);
    },
    updateCharacterAdds: (characterId, adds) => {
      return CharacterService.updateAdds(characterId, adds);
    },
    updateCharacterImpactValue: (characterId, impactKey, checked) => {
      return new Promise((resolve, reject) => {
        set((store) => {
          store.characters[characterId].debilities[impactKey] = checked;
          CharacterService.updateImpacts(
            characterId,
            store.characters[characterId].debilities,
          )
            .then(resolve)
            .catch(reject);
        });
      });
    },
    updateSpecialTrackValue: (characterId, specialTrackKey, value) => {
      return new Promise((resolve, reject) => {
        set((store) => {
          store.characters[characterId].specialTracks[specialTrackKey] = {
            ...store.characters[characterId].specialTracks[specialTrackKey],
            value,
          };
          CharacterService.updateSpecialTracks(
            characterId,
            store.characters[characterId].specialTracks,
          )
            .then(resolve)
            .catch(reject);
        });
      });
    },
    updateExperience: (characterId, experience) => {
      return CharacterService.updateExperience(characterId, experience);
    },
    deleteCharacter: (characterId) => {
      return CharacterService.deleteCharacter(characterId);
    },
  })),
  equal,
);

export function useListenToGameCharacters(gameId: string | undefined) {
  const listenToGameCharacters = useGameCharactersStore(
    (state) => state.listenToGameCharacters,
  );

  useSetGameCharacterPermissions();

  useEffect(() => {
    if (gameId) {
      const unsubscribe = listenToGameCharacters(gameId);
      return () => unsubscribe();
    }
  }, [gameId, listenToGameCharacters]);
} // Decreasing levels of ownership

export function useSetGameCharacterPermissions() {
  const uid = useUID();

  const gamePermission = useGameStore((state) => state.gamePermissions);
  const gameCharacters = useGameCharactersStore((state) => {
    return Object.entries(state.characters).map(([id, characterState]) => {
      return { id, characterOwnerId: characterState.uid };
    });
  });

  const setPermissions = useGameCharactersStore(
    (state) => state.setCharacterPermissions,
  );

  useEffect(() => {
    const characterPermissions: Record<string, CharacterPermissionType> = {};

    gameCharacters.forEach(({ id, characterOwnerId }) => {
      if (uid === characterOwnerId) {
        characterPermissions[id] = CharacterPermissionType.Owner;
      } else if (gamePermission === GamePermission.Guide) {
        characterPermissions[id] = CharacterPermissionType.Guide;
      } else if (gamePermission === GamePermission.Player) {
        characterPermissions[id] = CharacterPermissionType.OtherPlayer;
      } else {
        characterPermissions[id] = CharacterPermissionType.Viewer;
      }
    });

    setPermissions(characterPermissions);
  }, [gamePermission, gameCharacters, setPermissions, uid]);
}

export function useGameCharacter<T>(
  selector: (character: ICharacter | undefined) => T,
): T {
  const characterId = useCharacterIdOptional();
  return useGameCharactersStore((state) =>
    selector(characterId ? state.characters[characterId] : undefined),
  );
}
