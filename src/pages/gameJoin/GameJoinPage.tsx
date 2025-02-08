import { LinearProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { GradientButton } from "components/GradientButton";
import { PageContent, PageHeader } from "components/Layout";
import { EmptyState } from "components/Layout/EmptyState";

import { pathConfig } from "pages/pathConfig";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useUID } from "stores/auth.store";

import { GameType } from "repositories/game.repository";

import { GameService } from "services/game.service";

export default function GameJoinPage() {
  const inviteKey = useParams<{ inviteKey: string }>().inviteKey;
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.GameJoin);

  const uid = useUID();

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

  const addUser = () => {
    if (inviteKey && uid && gameType) {
      // Add user to campaign
      GameService.addPlayer(inviteKey, uid)
        .then((gameId) => {
          navigate(pathConfig.game(gameId));
        })
        .catch(() => {
          setError(t("game.join-failure", "Failed to join game"));
        });
    }
  };

  if (error) {
    return (
      <PageContent maxWidth="md">
        <EmptyState message={error} />
      </PageContent>
    );
  }
  if (loading || !gameName) {
    return <LinearProgress />;
  }

  return (
    <>
      <PageHeader
        label={t("game.join-name", "Join {{gameName}}", {
          gameName,
        })}
        maxWidth="md"
      />
      <PageContent maxWidth="md">
        <div>
          <GradientButton onClick={addUser}>
            {t("game.join", "Join")}
          </GradientButton>
        </div>
      </PageContent>
    </>
  );
}
