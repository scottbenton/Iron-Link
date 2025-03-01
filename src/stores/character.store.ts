import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";
import { CharacterService } from "@/services/character.service";

interface CharacterStoreState {
  portraits: Record<
    string,
    {
      url: string;
      filename: string;
    }
  >;
}

interface CharacterStoreActions {
  loadCharacterPortrait: (
    characterId: string,
    filename: string | undefined,
  ) => void;
}

export const useCharacterStore = createWithEqualityFn<
  CharacterStoreState & CharacterStoreActions
>()(
  immer((set, getState) => ({
    portraits: {},

    loadCharacterPortrait: (characterId, filename) => {
      const portraits = getState().portraits;
      if (filename) {
        // If the filename has changed since our last load
        if (portraits[characterId]?.filename !== filename) {
          set((store) => {
            store.portraits[characterId] = {
              url: CharacterService.getCharacterPortraitURL(
                characterId,
                filename,
              ),
              filename,
            };
          });
        }
      } else if (portraits[characterId]) {
        set((store) => {
          delete store.portraits[characterId];
        });
      }
    },
  })),
  deepEqual,
);

export function useCharacterPortrait(characterId: string) {
  const portrait = useCharacterStore((store) => store.portraits[characterId]);
  return portrait ?? { url: undefined, filename: "" };
}

export function useLoadCharacterPortrait(
  characterId: string,
  filename?: string,
) {
  const loadCharacterPortrait = useCharacterStore(
    (store) => store.loadCharacterPortrait,
  );

  useEffect(() => {
    loadCharacterPortrait(characterId, filename);
  }, [characterId, filename, loadCharacterPortrait]);
}
