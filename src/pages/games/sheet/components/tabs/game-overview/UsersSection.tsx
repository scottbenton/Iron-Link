import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useGameId } from "@/hooks/useGameId";
import { useGamePermissions } from "@/hooks/usePermissions";
import { GamePlayerRole } from "@/services/game.service";
import { GamePermission, useGameStore } from "@/stores/game.store";
import { Heading, Stack } from "@chakra-ui/react";
import { useMemo } from "react";

import { GameInviteButton } from "./GameInviteButton";
import { UserCard } from "./UserCard";

export function UsersSection() {
  const t = useGameTranslations();

  const users = useGameStore((store) => store.gamePlayers ?? {});
  const gameId = useGameId();

  const { gameType, gamePermission } = useGamePermissions();
  const areAnyPlayersGuides = useMemo(() => {
    return Object.values(users).some(
      (user) => user.role === GamePlayerRole.Guide,
    );
  }, [users]);

  return (
    <>
      <Heading size="xl" color="fg.muted" mt={4}>
        {t("game-tabs-users-heading", "Users")}
      </Heading>
      <Stack mt={2}>
        {Object.entries(users).map(([userId, user]) => (
          <UserCard
            key={userId}
            gameId={gameId}
            uid={userId}
            role={user.role}
            gamePermission={gamePermission}
            gameType={gameType}
            areAnyPlayersGuides={areAnyPlayersGuides}
          />
        ))}
        {gamePermission !== GamePermission.Viewer && <GameInviteButton />}
      </Stack>
    </>
  );
}
