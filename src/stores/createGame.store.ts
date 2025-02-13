import deepEqual from "fast-deep-equal";
import { Dispatch, SetStateAction } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import {
  ExpansionConfig,
  GameType,
  PlaysetConfig,
  RulesetConfig,
} from "repositories/game.repository";

import { GameService } from "services/game.service";

export interface CreateGameState {
  gameName: string;
  gameType: GameType;
  rulesets: RulesetConfig;
  expansions: ExpansionConfig;
  playset: PlaysetConfig;
}
interface CreateGameActions {
  createGame(uid: string, name: string): Promise<string>;
  setGameName: (name: string) => void;
  setGameType: (gameType: GameType) => void;
  toggleRuleset: (rulesetKey: string, active: boolean) => void;
  toggleExpansion: (
    rulesetKey: string,
    expansionKey: string,
    active: boolean,
  ) => void;
  setPlayset: Dispatch<SetStateAction<PlaysetConfig>>;

  reset: () => void;
}

const defaultState: CreateGameState = {
  gameName: "",
  gameType: GameType.Solo,
  rulesets: {},
  expansions: {},
  playset: {},
};

export const useCreateGameStore = createWithEqualityFn<
  CreateGameState & CreateGameActions
>()(
  immer((set, getState) => ({
    ...defaultState,
    createGame: (uid, name: string) => {
      const { gameType, rulesets, expansions, playset } = getState();
      return GameService.createGame(
        uid,
        name,
        gameType,
        rulesets,
        expansions,
        playset,
      );
    },

    setGameName: (name) => {
      set((state) => {
        state.gameName = name;
      });
    },
    setGameType: (gameType) => {
      set((state) => {
        state.gameType = gameType;
      });
    },
    toggleRuleset: (rulesetKey, active) => {
      set((state) => {
        state.rulesets[rulesetKey] = active;
      });
    },
    toggleExpansion: (rulesetKey, expansionKey, active) => {
      set((state) => {
        if (!state.expansions[rulesetKey]) {
          state.expansions[rulesetKey] = {};
        }
        state.expansions[rulesetKey][expansionKey] = active;
      });
    },
    setPlayset: (playset) => {
      if (typeof playset === "function") {
        set((state) => {
          state.playset = playset(state.playset);
        });
      } else {
        set((state) => {
          state.playset = playset;
        });
      }
    },
    reset: () => {
      set((store) => {
        store.gameName = defaultState.gameName;
        store.gameType = defaultState.gameType;
        store.rulesets = { ...defaultState.rulesets };
        store.expansions = { ...defaultState.expansions };
        store.playset = { ...defaultState.playset };
      });
    },
  })),
  deepEqual,
);
