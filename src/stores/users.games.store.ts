import deepEqual from "fast-deep-equal";
import { useEffect, useRef } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";
import { CharacterService, ICharacter } from "@/services/character.service";
import { GameService, IGame } from "@/services/game.service";

import { useUID } from "./auth.store";

export interface GameCharacterDisplayDetails {
  name: string;
  profileImageSettings: ICharacter["profileImage"];
  profileImageURL: string | null;
  uid: string;
}

interface UsersGamesState {
  games: Record<string, IGame>;
  characterDisplayDetails: Record<
    string,
    Record<string, GameCharacterDisplayDetails>
  >;
  loading: boolean;
  error?: Error;
}

interface UsersGamesActions {
  loadUsersGames: (uid: string) => Promise<void>;
}

const defaultValues: UsersGamesState = {
  games: {},
  characterDisplayDetails: {},
  loading: true,
};

export const useUsersGames = createWithEqualityFn<
  UsersGamesState & UsersGamesActions
>()(
  immer((set) => ({
    ...defaultValues,

    loadUsersGames: async (uid) => {
      try {
        const games = await GameService.getUsersGames(uid);
        set((state) => {
          state.loading = false;
          state.games = games;
          state.error = undefined;
        });

        const characterMap = await CharacterService.getCharactersInGames(
          Object.keys(games),
        );

        const portraitURLs = Object.fromEntries(
          Object.entries(characterMap).map(([characterId, character]) => {
            if (character.profileImage) {
              const url = CharacterService.getCharacterPortraitURL(
                characterId,
                character.profileImage.filename,
              );
              return [characterId, url];
            }
            return [characterId, undefined];
          }),
        );

        set((state) => {
          const characterDisplayDetails:
            UsersGamesState["characterDisplayDetails"] = {};

          Object.entries(characterMap).forEach(([characterId, character]) => {
            if (character.gameId) {
              if (!characterDisplayDetails[character.gameId]) {
                characterDisplayDetails[character.gameId] = {};
              }
              characterDisplayDetails[character.gameId][characterId] = {
                name: character.name,
                profileImageSettings: character.profileImage,
                profileImageURL: portraitURLs[characterId] ?? null,
                uid: character.uid,
              };
            }
          });
          state.characterDisplayDetails = characterDisplayDetails;
        });
      } catch (e) {
        console.error(e);
        set((state) => {
          state.loading = false;
          state.error = e instanceof Error
            ? e
            : new Error("Failed to load games");
        });
      }
    },
  })),
  deepEqual,
);

export function useLoadUsersGames() {
  const loadUsersGames = useUsersGames((state) => state.loadUsersGames);
  const uid = useUID();
  const loadingRef = useRef(false);
  useEffect(() => {
    if (uid) {
      loadingRef.current = true;
      loadUsersGames(uid);
    }
  }, [uid, loadUsersGames]);
}
