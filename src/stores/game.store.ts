import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { useSyncActiveRulesPackages } from "pages/games/create/hooks/useSyncActiveRulesPackages";

import {
  ExpansionConfig,
  GameType,
  PlaysetConfig,
  RulesetConfig,
} from "repositories/game.repository";
import { ColorScheme } from "repositories/shared.types";

import { IAsset } from "services/asset.service";
import { CharacterService } from "services/character.service";
import {
  GamePlayerRole,
  GameService,
  IGame,
  IGamePlayer,
} from "services/game.service";

import { useUID } from "./auth.store";

export enum GamePermission {
  Guide = "guide",
  Player = "player",
  Viewer = "viewer",
}

interface GameStoreState {
  gameId: string;
  game: IGame | null;
  gamePlayers: Record<string, IGamePlayer> | null;

  gamePermissions: GamePermission | null;

  loading: boolean;
  error?: string;

  sharedAssets: {
    loading: boolean;
    assets: Record<string, IAsset>;
    error?: string;
  };
}
interface GameStoreActions {
  listenToGame: (gameId: string) => () => void;
  setPermissions: (permissions: GamePermission) => void;
  getGameInviteKey: (gameId: string) => Promise<string>;
  updateGameName: (gameId: string, newName: string) => Promise<void>;
  updateConditionMeter: (
    gameId: string,
    conditionMeterKey: string,
    value: number,
  ) => Promise<void>;
  updateGameColorScheme: (
    gameId: string,
    colorScheme: ColorScheme | null,
  ) => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
  updateGameRulesPackages: (
    gameId: string,
    rulesets: RulesetConfig,
    expansions: ExpansionConfig,
    playset: PlaysetConfig,
  ) => Promise<void>;

  updateGamePlayerRole: (
    gameId: string,
    gamePlayerId: string,
    role: GamePlayerRole,
  ) => Promise<void>;

  removePlayerFromGame: (
    gameId: string,
    gamePlayerId: string,
    characterIds: string[],
  ) => Promise<void>;
}

const defaultGameStoreState: GameStoreState = {
  gameId: "",
  game: null,
  gamePlayers: null,
  gamePermissions: null,
  loading: true,
  sharedAssets: {
    loading: true,
    assets: {},
  },
};

export const useGameStore = createWithEqualityFn<
  GameStoreState & GameStoreActions
>()(
  immer((set) => ({
    ...defaultGameStoreState,
    listenToGame: (gameId: string) => {
      set((state) => {
        state.gameId = gameId;
      });
      const gameUnsubscribe = GameService.listenToGame(
        gameId,
        (game) => {
          set((state) => {
            state.game = game;
            state.loading = false;
            state.error = undefined;
          });
        },
        (error) => {
          console.error(error);
          set((state) => {
            state.loading = false;
            state.error = "Failed to load game";
          });
        },
      );

      const gamePlayerUnsubscribe = GameService.listenToGamePlayers(
        gameId,
        (gamePlayers, removedGamePlayerIds, replaceState) => {
          set((state) => {
            if (replaceState) {
              state.gamePlayers = gamePlayers;
            } else {
              state.gamePlayers = {
                ...state.gamePlayers,
                ...gamePlayers,
              };
              removedGamePlayerIds.forEach((id) => {
                delete state.gamePlayers?.[id];
              });
            }
          });
        },
        () => {},
      );

      return () => {
        set((state) => ({
          ...state,
          ...defaultGameStoreState,
        }));
        gameUnsubscribe();
        gamePlayerUnsubscribe();
      };
    },
    setPermissions: (permissions) => {
      set((state) => {
        state.gamePermissions = permissions;
      });
    },
    updateConditionMeter: (gameId, conditionMeterKey, value) => {
      return new Promise((resolve, reject) => {
        set((state) => {
          if (state.game?.id === gameId) {
            state.game.conditionMeters[conditionMeterKey] = value;
            GameService.updateConditionMeters(
              gameId,
              state.game.conditionMeters,
            )
              .then(resolve)
              .catch(reject);
          }
        });
      });
    },
    updateGameName: (gameId, newName) => {
      return GameService.changeName(gameId, newName);
    },
    updateGameColorScheme: (gameId, colorScheme) => {
      return GameService.updateColorScheme(
        gameId,
        colorScheme ?? ColorScheme.Default,
      );
    },
    updateGameRulesPackages: (gameId, rulesets, expansions, playset) => {
      return GameService.updateRules(gameId, rulesets, expansions, playset);
    },
    deleteGame: (gameId) => {
      return GameService.deleteGame(gameId);
    },

    getGameInviteKey: (gameId) => {
      return GameService.getGameInviteKey(gameId);
    },
    updateGamePlayerRole: (gameId, gamePlayerId, role) => {
      if (role === GamePlayerRole.Guide) {
        return GameService.addGuide(gameId, gamePlayerId);
      }
      return GameService.removeGuide(gameId, gamePlayerId);
    },
    removePlayerFromGame: (gameId, gamePlayerId, characterIds) => {
      const promises: Promise<void>[] = [];
      characterIds.forEach((characterId) => {
        promises.push(CharacterService.deleteCharacter(characterId));
      });
      promises.push(GameService.removePlayer(gameId, gamePlayerId));

      return new Promise((resolve, reject) => {
        Promise.all(promises)
          .then(() => resolve())
          .catch(reject);
      });
    },
  })),
  deepEqual,
);

export function useListenToGame(gameId: string | undefined) {
  const uid = useUID();

  const gamePlayers = useGameStore((store) => store.gamePlayers);
  const gameType = useGameStore((state) => state.game?.gameType);

  const expansionsRulesetsAndPlayset = useGameStore((store) => ({
    expansions: store.game?.expansions ?? {},
    rulesets: store.game?.rulesets ?? {},
    playset: store.game?.playset ?? {},
  }));

  useSyncActiveRulesPackages(
    expansionsRulesetsAndPlayset.rulesets,
    expansionsRulesetsAndPlayset.expansions,
    expansionsRulesetsAndPlayset.playset,
  );

  const listenToGame = useGameStore((state) => state.listenToGame);
  const setPermissions = useGameStore((state) => state.setPermissions);

  useEffect(() => {
    if (gameId) {
      return listenToGame(gameId);
    }
  }, [gameId, listenToGame]);

  useEffect(() => {
    if (gameId && gamePlayers) {
      const isGamePlayer = uid ? gamePlayers[uid] !== undefined : false;
      const isGuide = uid
        ? gamePlayers[uid]?.role === GamePlayerRole.Guide
        : false;

      if (!uid) {
        setPermissions(GamePermission.Viewer);
      } else if (
        (gameType === GameType.Solo || gameType === GameType.Coop) &&
        isGamePlayer
      ) {
        setPermissions(GamePermission.Guide);
      } else if (isGuide) {
        setPermissions(GamePermission.Guide);
      } else if (isGamePlayer) {
        setPermissions(GamePermission.Player);
      } else {
        setPermissions(GamePermission.Viewer);
      }
    }
  }, [gamePlayers, gameId, gameType, setPermissions, uid]);
}
