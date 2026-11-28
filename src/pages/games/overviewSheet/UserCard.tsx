import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import { useConfirm } from "ui/components/ConfirmDialog";
import { PlayerCard } from "ui/game/PlayerCard";

import { useUID } from "stores/auth.store";
import { GamePermission, useGameStore } from "stores/game.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";
import { useUserName } from "stores/users.store";

import { GameType } from "repositories/game.repository";

import { GamePlayerRole } from "services/game.service";

import { usePlayerCharacters } from "./usePlayerCharacters";

export interface UserCardProps {
  uid: string;
  role: GamePlayerRole;
  gameType: GameType;
  gamePermission: GamePermission | null;
  areAnyPlayersGuides: boolean;
  gameId: string;
}

/**
 * A person in the game, with what the reader may do about them: a Guide
 * hands out and gives up the role and removes players; anyone may leave, and
 * may take the role while the game has no Guide.
 */
export function UserCard(props: UserCardProps) {
  const { gameId, uid, role, gameType, gamePermission, areAnyPlayersGuides } =
    props;
  const { t } = useTranslation();

  const currentUserId = useUID();
  const userName = useUserName(uid);
  const characters = usePlayerCharacters(uid);
  // Removing a player deletes their characters, so wait until those load.
  const charactersLoading = useGameCharactersStore((store) => store.loading);

  const isUser = currentUserId === uid;
  const isCurrentUserGuide =
    gameType === GameType.Guided && gamePermission === GamePermission.Guide;

  const updateGamePlayerRole = useGameStore(
    (store) => store.updateGamePlayerRole,
  );
  const removePlayerFromGame = useGameStore(
    (store) => store.removePlayerFromGame,
  );
  const confirm = useConfirm();

  const setRole = (newRole: GamePlayerRole) => {
    updateGamePlayerRole(gameId, uid, newRole).catch(() => {});
  };

  const handleRemove = () => {
    if (charactersLoading) return;
    const characterIds = characters.map((character) => character.id);
    confirm(
      isUser
        ? {
            title: t(
              "game.overview.leave-game-confirmation-title",
              "Leave Game",
            ),
            description: t(
              "game.overview.leave-game-confirmation-text",
              "Leave this game? Your characters in it are deleted too.",
            ),
            confirmationText: t(
              "game.overview.leave-game-confirmation-button",
              "Leave Game",
            ),
          }
        : {
            title: t(
              "game.game-overview.remove-user-confirmation-title",
              "Remove User",
            ),
            description: t(
              "game.game-overview.remove-user-confirmation-text-characters",
              "Remove {{name}} from this game? Their characters in it are deleted too.",
              { name: userName },
            ),
            confirmationText: t(
              "game.game-overview.remove-user-confirmation-button",
              "Remove User",
            ),
          },
    )
      .then(({ confirmed }) => {
        if (!confirmed) return;
        removePlayerFromGame(gameId, uid, characterIds).catch(() => {});
      })
      .catch(() => {});
  };

  const canMakeGuide =
    (isCurrentUserGuide && role !== GamePlayerRole.Guide) ||
    (isUser && !areAnyPlayersGuides);
  const canLeaveGuideRole = isCurrentUserGuide && isUser;
  const canRemove = isCurrentUserGuide || isUser;

  return (
    <PlayerCard
      name={userName}
      role={
        gameType === GameType.Guided
          ? role === GamePlayerRole.Guide
            ? "guide"
            : "player"
          : undefined
      }
      roleLabels={{
        guide: t("game.overview.guide", "Guide"),
        player: t("game.overview.player", "Player"),
        viewer: t("game.overview.viewer", "Viewer"),
      }}
      isYou={isUser}
      youLabel={t("game.overview.you", "(you)")}
      characters={characters}
      headingAs="h4"
      actions={
        (canMakeGuide || canLeaveGuideRole || canRemove) && (
          <>
            {canMakeGuide && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRole(GamePlayerRole.Guide)}
              >
                {t("game.overview.makeGuide", "Make Guide")}
              </Button>
            )}
            {canLeaveGuideRole && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRole(GamePlayerRole.Player)}
              >
                {t("game.overview.makePlayer", "Leave Guide Role")}
              </Button>
            )}
            {canRemove && (
              <Button size="sm" variant="ghost" onClick={handleRemove}>
                {isUser
                  ? t("game.overview.leave-game", "Leave Game")
                  : t("game.overview.kick-player", "Kick Player")}
              </Button>
            )}
          </>
        )
      }
    />
  );
}
