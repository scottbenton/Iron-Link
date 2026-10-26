import equal from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";

import {
  CharacterEditPermissions,
  InitiativeStatus,
} from "repositories/character.repository";
import { ColorScheme } from "repositories/shared.types";

import { CharacterService, ICharacter } from "services/character.service";

import { useUID } from "./auth.store";
import { CharacterAccess, getCharacterAccess } from "./characterAccess";
import { useGameStore } from "./game.store";

interface GameCharactersStoreState {
  characters: Record<string, ICharacter>;
  loading: boolean;
  error?: string;
}

interface GameCharactersStoreActions {
  listenToGameCharacters: (gameId: string) => () => void;

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
  updateCharacterEditPermissions: (
    characterId: string,
    editPermissions: CharacterEditPermissions,
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
  updateSpecialTrackIsLegacy: (
    characterId: string,
    specialTrackKey: string,
    isLegacy: boolean,
  ) => Promise<void>;
  updateExperience: (characterId: string, experience: number) => Promise<void>;
  deleteCharacter: (characterId: string) => Promise<void>;
}

const defaultState: GameCharactersStoreState = {
  characters: {},
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
        (changedCharacters, removedCharacterIds, replaceState) => {
          set((store) => {
            store.loading = false;
            store.error = undefined;

            if (replaceState) {
              store.characters = changedCharacters;
            } else {
              Object.entries(changedCharacters).forEach(([id, character]) => {
                store.characters[id] = character;
              });
              removedCharacterIds.forEach((id) => {
                delete store.characters[id];
              });
            }
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
    updateCharacterEditPermissions: (characterId, editPermissions) => {
      return CharacterService.updateCharacterEditPermissions(
        characterId,
        editPermissions,
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
      const previousAdds = getState().characters[characterId]?.adds;

      set((store) => {
        if (store.characters[characterId]) {
          store.characters[characterId].adds = adds;
        }
      });

      return CharacterService.updateAdds(characterId, adds).catch((error) => {
        if (previousAdds !== undefined) {
          set((store) => {
            if (store.characters[characterId]) {
              store.characters[characterId].adds = previousAdds;
            }
          });
        }
        throw error;
      });
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
    updateSpecialTrackIsLegacy: (characterId, specialTrackKey, isLegacy) => {
      return new Promise((resolve, reject) => {
        set((store) => {
          // Toggling the legacy state clears the track's progress
          store.characters[characterId].specialTracks[specialTrackKey] = {
            value: 0,
            isLegacy,
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

  useEffect(() => {
    if (gameId) {
      const unsubscribe = listenToGameCharacters(gameId);
      return () => unsubscribe();
    }
  }, [gameId, listenToGameCharacters]);
}

// Who may do what with any character in the current game, recomputed live as
// the character's edit_permissions or the user's game role changes.
export function useCharacterAccess(
  characterId: string | undefined | null,
): CharacterAccess {
  const uid = useUID();
  const gamePermission = useGameStore((state) => state.gamePermissions);

  return useGameCharactersStore((state) => {
    const character = characterId ? state.characters[characterId] : undefined;
    return getCharacterAccess({
      uid,
      ownerId: character?.uid,
      editPermissions: character?.editPermissions,
      gamePermission,
    });
  });
}

export function useGameCharacter<T>(
  selector: (character: ICharacter | undefined) => T,
): T {
  const characterId = useCharacterIdOptional();
  return useGameCharactersStore((state) =>
    selector(characterId ? state.characters[characterId] : undefined),
  );
}
