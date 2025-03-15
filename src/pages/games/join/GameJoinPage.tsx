import { ProgressBar } from "@/components/common/ProgressBar";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { useGameJoinTranslations } from "@/hooks/i18n/useGameJoinTranslations";
import { pageConfig } from "@/pages/pageConfig";
import { GameType } from "@/repositories/game.repository";
import { GameService } from "@/services/game.service";
import { useUID } from "@/stores/auth.store";
import { Box, Button, Heading } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";

export default function GameJoinPage() {
  const inviteKey = useParams<{ inviteKey: string }>().inviteKey;
  const t = useGameJoinTranslations();

  const uid = useUID();

  const navigate = useLocation()[1];

  const [gameName, setGameName] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (inviteKey && uid) {
      GameService.getGameInviteInfo(inviteKey)
        .then((gameInfo) => {
          if ("gameId" in gameInfo) {
            navigate(pageConfig.game(gameInfo.gameId));
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
          navigate(pageConfig.game(gameId));
        })
        .catch(() => {
          setError(t("game.join-failure", "Failed to join game"));
        });
    }
  };

  if (error) {
    return (
      <PageContent maxWidth="breakpoint-md" sheet>
        <EmptyState message={error} />
      </PageContent>
    );
  }
  if (loading || !gameName) {
    return <ProgressBar />;
  }

  return (
    <>
      <PageHeader
        title={t("game.join-name", "Join Game")}
        maxWidth="breakpoint-md"
      />
      <PageContent maxWidth="breakpoint-md" sheet>
        <Box>
          <Heading size="2xl">{gameName}</Heading>
          <Button mt={2} onClick={addUser}>
            {t("game.join", "Join Game")}
          </Button>
        </Box>
      </PageContent>
    </>
  );
}
