import { GridLayout } from "@/components/layout/GridLayout";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { useGameSelectTranslations } from "@/hooks/i18n/useGameSelectTranslations";
import { pageConfig } from "@/pages/pageConfig";
import { useLoadUsersGames, useUsersGames } from "@/stores/users.games.store";
import { Button } from "@chakra-ui/react";
import { PlusIcon } from "lucide-react";
import { Link } from "wouter";

import { GameCard } from "./GameCard";

export default function GameSelectPage() {
  const t = useGameSelectTranslations();

  useLoadUsersGames();
  const gameState = useUsersGames();

  return (
    <>
      <PageHeader
        title={t("title", "Your Games")}
        action={
          <Button asChild>
            <Link href={pageConfig.gameCreate}>
              {t("create-game-button", "Create Game")}
              <PlusIcon />
            </Link>
          </Button>
        }
      />
      <PageContent>
        <GridLayout
          mt={4}
          items={Object.entries(gameState.games)}
          renderItem={([key, game]) => (
            <GameCard key={key} gameId={key} game={game} />
          )}
          loading={gameState.loading}
          error={
            gameState.error
              ? t("error-message", "Failed to load games")
              : undefined
          }
          emptyStateMessage={t("empty-state-message", "No games found")}
          minWidth={300}
        />
      </PageContent>
    </>
  );
}
