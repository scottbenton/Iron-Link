import { Box, Button, Card, Typography } from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { useUID } from "stores/auth.store";
import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useUserName } from "stores/users.store";

import { GameType } from "repositories/game.repository";

import { GamePlayerRole } from "services/game.service";

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

  const { error } = useSnackbar();
  const confirm = useConfirm();

  const handleMakeGuide = useCallback(() => {
    updateGamePlayerRole(gameId, uid, GamePlayerRole.Guide).catch(() => {
      error(t("game.overview.error", "Failed to make user a guide"));
    });
  }, [updateGamePlayerRole, uid, gameId, error, t]);

  const handleKick = useCallback(() => {
    if (charactersByUser) {
      confirm({
        title: t(
          "game.game-overview.remove-user-confirmation-title",
          "Remove User",
        ),
        description: t(
          "game.game-overview.remove-user-confirmation-text",
          "Are you sure you want to remove this user?",
        ),
        confirmationText: t(
          "game.game-overview.remove-user-confirmation-button",
          "Remove User",
        ),
      })
        .then(() => {
          removePlayerFromGame(gameId, uid, charactersByUser[uid] ?? []).catch(
            () => {
              error(t("game.overview.error", "Failed to kick user"));
            },
          );
        })
        .catch(() => {});
    }
  }, [removePlayerFromGame, gameId, uid, charactersByUser, error, t, confirm]);

  return (
    <Card sx={{ mt: 1 }} variant="outlined">
      <Box p={2}>
        <Typography variant="h6" fontFamily="fontFamilyTitle">
          {userName}
        </Typography>
        {gameType === GameType.Guided && <Typography>{roleName}</Typography>}
      </Box>
      <Box display="flex" justifyContent="flex-end" flexWrap="wrap" gap={1}>
        {((isCurrentUserGuide && role !== GamePlayerRole.Guide) ||
          (isUser && !areAnyPlayersGuides)) && (
          <Button color="inherit" onClick={handleMakeGuide}>
            {t("game.overview.makeGuide", "Make Guide")}
          </Button>
        )}
        {(isCurrentUserGuide || isUser) && (
          <Button color="error" onClick={handleKick}>
            {isUser ? "Leave Game" : "Kick Player"}
          </Button>
        )}
      </Box>
    </Card>
  );
}
