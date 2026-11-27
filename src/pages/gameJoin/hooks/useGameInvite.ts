import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { pathConfig } from "pages/pathConfig";

import { GameType } from "repositories/game.repository";

import { GameService } from "services/game.service";

/**
 * Reads an invite and joins its game. A player already in the game goes
 * straight to it.
 */
export function useGameInvite(
  inviteKey: string | undefined,
  uid: string | undefined,
) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [gameName, setGameName] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (inviteKey && uid) {
      GameService.getGameInviteInfo(inviteKey)
        .then((gameInfo) => {
          if ("gameId" in gameInfo) {
            navigate(pathConfig.game(gameInfo.gameId));
            return;
          }
          setLoading(false);
          setError(undefined);
          setGameName(gameInfo.name);
          setGameType(gameInfo.gameType);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
          setError(t("game.load-failure", "Failed to load game"));
        });
    } else {
      setLoading(false);
      setError(t("game.find-failure", "Could not find game"));
    }
  }, [inviteKey, uid, t, navigate]);

  const join = useCallback(() => {
    if (inviteKey && uid && gameType) {
      GameService.addPlayer(inviteKey, uid)
        .then((gameId) => {
          navigate(pathConfig.game(gameId));
        })
        .catch(() => {
          setError(t("game.join-failure", "Failed to join game"));
        });
    }
  }, [gameType, inviteKey, navigate, t, uid]);

  return { gameName, loading, error, join };
}
