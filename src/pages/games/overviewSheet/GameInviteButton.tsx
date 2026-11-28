import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "ui/components/Alert";
import { CopyButton } from "ui/components/CopyButton";

import { useGameStore } from "stores/game.store";

import { useGameId } from "../gamePageLayout/hooks/useGameId";

/**
 * Copies the game's invite link. The tab shows it only to players and
 * Guides of a game with more than one person.
 */
export function GameInviteButton() {
  const { t } = useTranslation();

  const gameId = useGameId();
  const loadGameInviteKey = useGameStore((state) => state.getGameInviteKey);

  const [inviteKey, setInviteKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;
    loadGameInviteKey(gameId)
      .then((key) => {
        if (current) setInviteKey(key);
      })
      .catch(() => {
        if (current) setFailed(true);
      });
    return () => {
      current = false;
    };
  }, [gameId, loadGameInviteKey]);

  if (failed) {
    return (
      <Alert tone="danger">
        {t("game.invite.error", "Failed to load invite key")}
      </Alert>
    );
  }

  return (
    <CopyButton
      variant="outline"
      text={`${location.origin}/join/${inviteKey ?? ""}`}
      disabled={!inviteKey}
      label={t("game.overview.invite", "Copy Invite Link")}
      copiedLabel={t("game.overview.invite-copied", "Invite Link Copied")}
    />
  );
}
