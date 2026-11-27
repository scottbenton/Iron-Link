import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { pathConfig } from "pages/pathConfig";

import { useUID } from "stores/auth.store";
import { useCreateCharacterStore } from "stores/createCharacter.store";
import { useCreateGameStore } from "stores/createGame.store";

import { GameType } from "repositories/game.repository";

/**
 * Creates the game (and, for a solo game, its character) from the create
 * stores, then opens it. Failures are passed to `setError`.
 */
export function useCreateGameSubmit(
  setError: (error: string | undefined) => void,
) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const uid = useUID();

  const createGame = useCreateGameStore((store) => store.createGame);
  const createCharacter = useCreateCharacterStore(
    (store) => store.createCharacter,
  );

  const [creating, setCreating] = useState(false);

  const create = useCallback(() => {
    const { gameName, gameType } = useCreateGameStore.getState();
    const { characterName } = useCreateCharacterStore.getState();

    const finalGameName = gameType === GameType.Solo ? characterName : gameName;
    if (!finalGameName) {
      setError(t("game.create.error-no-name", "Please enter a name"));
      return;
    }
    if (!uid) {
      return;
    }

    setError(undefined);
    setCreating(true);
    createGame(uid, finalGameName)
      .then((gameId) => {
        if (gameType === GameType.Solo) {
          createCharacter(gameId, uid)
            .then((characterId) => {
              navigate(pathConfig.gameCharacter(gameId, characterId));
            })
            .catch(() => {
              setCreating(false);
              setError(
                t(
                  "game.create.error-creating-character",
                  "Error creating character",
                ),
              );
            });
        } else {
          navigate(pathConfig.game(gameId));
        }
      })
      .catch((e) => {
        setCreating(false);
        console.error(e);
        setError(t("game.create.error-creating-game", "Error creating game"));
      });
  }, [t, navigate, uid, setError, createGame, createCharacter]);

  return { create, creating };
}
