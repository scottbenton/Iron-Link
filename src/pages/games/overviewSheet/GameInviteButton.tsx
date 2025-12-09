import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { CopyButton } from "components/CopyButton";

import { GamePermission, useGameStore } from "stores/game.store";

import { GameType } from "repositories/game.repository";

import { useGameId } from "../gamePageLayout/hooks/useGameId";
import { useGamePermissions } from "../gamePageLayout/hooks/usePermissions";

export function GameInviteButton() {
  const { t } = useTranslation();

  const gameId = useGameId();
  const { gameType, gamePermission } = useGamePermissions();

  const loadGameInviteKey = useGameStore((state) => state.getGameInviteKey);

  const [inviteKey, setInviteKey] = useState<string | null>(null);
  const [inviteKeyError, setInviteKeyError] = useState<string | null>(null);
  const isAlreadyLoadingRef = useRef(false);

  const inviteURL = location.origin + "/join/";

  useEffect(() => {
    const handleFetchInviteKey = async () => {
      if (isAlreadyLoadingRef.current) return;
      isAlreadyLoadingRef.current = true;
      loadGameInviteKey(gameId)
        .then((key) => {
          setInviteKey(key);
        })
        .catch(() => {
          setInviteKeyError(
            t("game.invite.error", "Failed to load invite key"),
          );
        });
    };

    handleFetchInviteKey();
  }, [gameId, t, loadGameInviteKey]);

  return (
    <>
      {gamePermission !== GamePermission.Viewer &&
        gameType !== GameType.Solo && (
          <CopyButton
            dialogTitle={t("game.invite.title", "Invite to game")}
            dialogContent={t(
              "game.invite.copyUrl",
              "Copy this URL to invite others to the game",
            )}
            link={inviteKey ? `${inviteURL}${inviteKey}` : undefined}
            error={
              inviteKeyError
                ? t("game.invite.error", "Failed to load invite key")
                : undefined
            }
            variant="outlined"
            color="inherit"
            sx={{ mt: 1 }}
          >
            {t("game.overview.invite", "Copy Invite Link")}
          </CopyButton>
        )}
    </>
  );
}
