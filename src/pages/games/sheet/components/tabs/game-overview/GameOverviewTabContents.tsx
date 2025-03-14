import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGamePermissions } from "@/hooks/usePermissions";
import { GameType } from "@/repositories/game.repository";
import { Box, Heading } from "@chakra-ui/react";

import { GameCharacterCards } from "./GameCharacterCards";
import { UsersSection } from "./UsersSection";

export function GameOverviewTabContents() {
  const t = useGameTranslations();
  const { gameType } = useGamePermissions();
  return (
    <Box>
      <Heading size="xl" color="fg.muted">
        {t("game-tabs-characters-heading", "Characters")}
      </Heading>
      <GameCharacterCards />
      {gameType !== GameType.Solo && <UsersSection />}
    </Box>
  );
}
