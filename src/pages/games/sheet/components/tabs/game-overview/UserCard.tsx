import { useConfirm } from "@/providers/ConfirmProvider";
import { GameType } from "@/repositories/game.repository";
import { GamePlayerRole } from "@/services/game.service";
import { useUID } from "@/stores/auth.store";
import { GamePermission, useGameStore } from "@/stores/game.store";
import { useGameCharactersStore } from "@/stores/gameCharacters.store";
import { useUserName } from "@/stores/users.store";
import { Button, Card, Group, Heading, Text } from "@chakra-ui/react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface UserCardProps {
  uid: string;
  role: GamePlayerRole;
  gameType: GameType;
  gamePermission: GamePermission | null;
  areAnyPlayersGuides: boolean;
  gameId: string;
}

export function UserCard(props: UserCardProps) {
  const { gameId, uid, role, gameType, gamePermission, areAnyPlayersGuides } =
    props;
  const { t } = useTranslation();

  const currentUserId = useUID();

  const userName = useUserName(uid);

  const roleName = useMemo(() => {
    if (role === GamePlayerRole.Guide) {
      return t("game.overview.guide", "Guide");
    }
    if (role === GamePlayerRole.Player) {
      return t("game.overview.player", "Player");
    }
  }, [t, role]);

  const charactersByUser = useGameCharactersStore((store) => {
    if (store.loading) {
      return null;
    } else {
      const characterIds: Record<string, string[]> = {};
      Object.entries(store.characters).forEach(([characterId, character]) => {
        if (character.uid in characterIds) {
          characterIds[character.uid].push(characterId);
        } else {
          characterIds[character.uid] = [characterId];
        }
      });
      return characterIds;
    }
  });
  const isUser = currentUserId === uid;
  const isCurrentUserGuide =
    gameType === GameType.Guided && gamePermission === GamePermission.Guide;

  const updateGamePlayerRole = useGameStore(
    (store) => store.updateGamePlayerRole,
  );
  const removePlayerFromGame = useGameStore(
    (store) => store.removePlayerFromGame,
  );

  const handleMakeGuide = useCallback(() => {
    updateGamePlayerRole(gameId, uid, GamePlayerRole.Guide).catch(() => {});
  }, [updateGamePlayerRole, uid, gameId]);

  const handleReturnToPlayer = useCallback(() => {
    updateGamePlayerRole(gameId, uid, GamePlayerRole.Player).catch(() => {});
  }, [updateGamePlayerRole, uid, gameId]);

  const confirm = useConfirm();
  const handleKick = useCallback(() => {
    if (charactersByUser) {
      confirm({
        title: t(
          "game.game-overview.remove-user-confirmation-title",
          "Remove User",
        ),
        message: t(
          "game.game-overview.remove-user-confirmation-text",
          "Are you sure you want to remove this user?",
        ),
        confirmText: t(
          "game.game-overview.remove-user-confirmation-button",
          "Remove User",
        ),
      }).then(({ confirmed }) => {
        if (confirmed) {
          removePlayerFromGame(gameId, uid, charactersByUser[uid] ?? []).catch(
            () => {},
          );
        }
      });
    }
  }, [removePlayerFromGame, gameId, uid, charactersByUser, t, confirm]);

  return (
    <Card.Root>
      <Card.Body p={4}>
        <Heading as="span" size="xl">
          {userName}
        </Heading>
        {gameType === GameType.Guided && (
          <Text color="fg.muted">{roleName}</Text>
        )}
      </Card.Body>
      <Card.Footer pb={0} px={0}>
        <Group justifyContent={"flex-end"} flexGrow={1}>
          {((isCurrentUserGuide && role !== GamePlayerRole.Guide) ||
            (isUser && !areAnyPlayersGuides)) && (
            <Button
              colorPalette="gray"
              variant="ghost"
              onClick={handleMakeGuide}
            >
              {t("game.overview.makeGuide", "Make Guide")}
            </Button>
          )}
          {isCurrentUserGuide && isUser && (
            <Button
              colorPalette="gray"
              variant="ghost"
              onClick={handleReturnToPlayer}
            >
              {t("game.overview.makePlayer", "Leave Guide Role")}
            </Button>
          )}
          {(isCurrentUserGuide || isUser) && (
            <Button colorPalette="red" variant="ghost" onClick={handleKick}>
              {isUser ? "Leave Game" : "Kick Player"}
            </Button>
          )}
        </Group>
      </Card.Footer>
    </Card.Root>
  );
}
