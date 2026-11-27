import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { Button } from "ui/components/Button";
import { Progress } from "ui/components/Progress";
import { PlusIcon } from "ui/icons";
import { EmptyState, PageContent, PageHeader } from "ui/layout";
import { Grid } from "ui/primitives";

import { pathConfig } from "pages/pathConfig";

import { useDocumentTitle } from "hooks/useDocumentTitle";
import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useLoadUsersGames, useUsersGames } from "stores/users.games.store";

import { GameCard } from "./GameCard";

export default function GameSelectPage() {
  const { t } = useTranslation();
  const title = t("game.list.header", "Your Games");
  useDocumentTitle(title);
  useSendPageViewEvent(PageCategory.GameSelect);

  useLoadUsersGames();
  const gameState = useUsersGames();
  const games = Object.entries(gameState.games);

  const createGameButton = (
    <Button
      variant="gradient"
      startIcon={<PlusIcon />}
      nativeButton={false}
      render={<LinkComponent href={pathConfig.gameCreate} />}
    >
      {t("game.list.create", "Create Game")}
    </Button>
  );

  return (
    <>
      {/* The page's one heading; the cards' game names are its h2s. */}
      <PageHeader title={title} actions={createGameButton} />
      <PageContent>
        {gameState.loading ? (
          <Progress label={t("game.list.loading", "Loading your games")} />
        ) : gameState.error ? (
          <EmptyState
            title={t(
              "game.list.error-loading-games",
              "Failed to load your games. Please try again later.",
            )}
          />
        ) : games.length === 0 ? (
          <EmptyState
            icon={<PlusIcon />}
            title={t("game.list.no-games-found", "No games found")}
            message={t(
              "game.list.no-games-message",
              "Start a game to track characters, vows and progress with your group or on your own.",
            )}
            action={createGameButton}
          />
        ) : (
          <Grid
            as="ul"
            listStyle="none"
            margin="0"
            padding="0"
            gridTemplateColumns="repeat(auto-fill, minmax(min(300px, 100%), 1fr))"
            gap="3"
          >
            {games.map(([gameId, game]) => (
              <GameCard key={gameId} gameId={gameId} game={game} />
            ))}
          </Grid>
        )}
      </PageContent>
    </>
  );
}
