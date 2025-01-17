import { LinearProgress } from "@mui/material";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { GradientButton } from "components/GradientButton";
import { PageContent, PageHeader } from "components/Layout";
import { EmptyState } from "components/Layout/EmptyState";
import { useGameId } from "components/pages/games/gamePageLayout/hooks/useGameId";

import { useUID } from "stores/auth.store";

import { usePathConfig } from "lib/paths.lib";

import { GameType } from "repositories/game.repository";

import { GameService } from "services/game.service";

export const Route = createLazyFileRoute(
  "/_defaultNavLayout/games/$gameId/join",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();

  const gameId = useGameId();
  const uid = useUID();

  const navigate = useNavigate();
  const pathConfig = usePathConfig();

  const [gameName, setGameName] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (gameId && uid) {
      GameService.getGameInviteInfo(gameId, uid)
        .then((game) => {
          setLoading(false);
          setError(undefined);
          setGameName(game.name);
          setGameType(game.gameType);
          if (game.isPlayer) {
            navigate({
              from: pathConfig.gameJoin,
              to: pathConfig.game,
              params: { gameId },
            });
          }
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
  }, [gameId, uid, t, navigate, pathConfig]);

  const addUser = () => {
    if (gameId && uid && gameType) {
      // Add user to campaign
      GameService.addPlayer(gameId, gameType, uid)
        .then(() => {
          navigate({
            from: pathConfig.gameJoin,
            to: pathConfig.game,
            params: { gameId },
          });
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
