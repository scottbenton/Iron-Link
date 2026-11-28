import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { Button } from "ui/components/Button";
import { PlusIcon } from "ui/icons";
import { SectionHeading } from "ui/layout";
import { Grid, HStack, Stack } from "ui/primitives";

import { pathConfig } from "pages/pathConfig";

import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

import { GameType } from "repositories/game.repository";

import { GamePlayerRole } from "services/game.service";

import { useGameId } from "../gamePageLayout/hooks/useGameId";
import { useGamePermissions } from "../gamePageLayout/hooks/usePermissions";
import { CharacterCard } from "./CharacterCard";
import { GameInviteButton } from "./GameInviteButton";
import { UserCard } from "./UserCard";

/**
 * The overview's Characters tab: the game's characters, then (except in
 * solo games) its players and the invite link. Cards sit two or more to a
 * row where the column is wide enough, each row as tall as its tallest.
 */
export function CharactersAndUsersTab() {
  const gameId = useGameId();
  const { t } = useTranslation();

  const characters = useGameCharactersStore((state) =>
    Object.values(state.characters),
  );
  const users = useGameStore((store) => store.gamePlayers ?? {});

  const { gameType, gamePermission } = useGamePermissions();
  const canEdit = gamePermission !== GamePermission.Viewer;
  const areAnyPlayersGuides = useMemo(
    () =>
      Object.values(users).some((user) => user.role === GamePlayerRole.Guide),
    [users],
  );

  return (
    <Stack gap="6" mt="4">
      <Stack gap="3" as="section">
        <SectionHeading
          title={t("game.overview.characters", "Characters")}
          as="h3"
        />
        <Grid
          gridTemplateColumns="repeat(auto-fill, minmax(min(100%, 260px), 1fr))"
          gap="3"
        >
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              gameId={gameId}
              character={character}
            />
          ))}
        </Grid>
        {canEdit && (
          <HStack>
            <Button
              variant="outline"
              startIcon={<PlusIcon />}
              render={
                <LinkComponent href={pathConfig.gameCharacterCreate(gameId)} />
              }
              nativeButton={false}
            >
              {t("game.overview.add-character", "Add Character")}
            </Button>
          </HStack>
        )}
      </Stack>

      {gameType !== GameType.Solo && (
        <Stack gap="3" as="section">
          <SectionHeading
            title={t("game.overview.players", "Players")}
            as="h3"
          />
          <Grid
            gridTemplateColumns="repeat(auto-fill, minmax(min(100%, 260px), 1fr))"
            gap="3"
          >
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
          </Grid>
          {canEdit && (
            <HStack>
              <GameInviteButton />
            </HStack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
