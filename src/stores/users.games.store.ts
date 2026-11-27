import deepEqual from "fast-deep-equal";
import { useEffect, useRef } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { CharacterService, ICharacter } from "services/character.service";
import { GameService, IGame } from "services/game.service";
import { WorldsService } from "services/worlds.service";

import { useUID } from "./auth.store";

export interface GameCharacterDisplayDetails {
  name: string;
  colorScheme: ICharacter["colorScheme"];
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
  /** World id to name, for the worlds the games are linked to. */
  worldNames: Record<string, string>;
  loading: boolean;
  error?: Error;
}

interface UsersGamesActions {
  loadUsersGames: (uid: string) => Promise<void>;
}

const defaultValues: UsersGamesState = {
  games: {},
  characterDisplayDetails: {},
  worldNames: {},
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

        const worldIds = [
          ...new Set(
            Object.values(games)
              .map((game) => game.worldId)
              .filter((worldId): worldId is string => !!worldId),
          ),
        ];
        // The world names are extra: a failed read leaves the cards on
        // their rules instead of failing the list.
        const worldNamesPromise = WorldsService.getWorldNames(worldIds).catch(
          (e) => {
            console.error(e);
            return {};
          },
        );

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
          const characterDisplayDetails: UsersGamesState["characterDisplayDetails"] =
            {};

          Object.entries(characterMap).forEach(([characterId, character]) => {
            if (character.gameId) {
              if (!characterDisplayDetails[character.gameId]) {
                characterDisplayDetails[character.gameId] = {};
              }
              characterDisplayDetails[character.gameId][characterId] = {
                name: character.name,
                colorScheme: character.colorScheme,
                profileImageSettings: character.profileImage,
                profileImageURL: portraitURLs[characterId] ?? null,
                uid: character.uid,
              };
            }
          });
          state.characterDisplayDetails = characterDisplayDetails;
        });

        const worldNames = await worldNamesPromise;
        set((state) => {
          state.worldNames = worldNames;
        });
      } catch (e) {
        console.error(e);
        set((state) => {
          state.loading = false;
          state.error =
            e instanceof Error ? e : new Error("Failed to load games");
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
