import LinkOffIcon from "@mui/icons-material/LinkOff";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { Box, Button } from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";
import { WorldPanel } from "components/worlds/WorldPanel";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { GamePermission, useGameStore } from "stores/game.store";
import { useNotesStore } from "stores/notes.store";

import { WorldsService } from "services/worlds.service";

import { useGameWorldId } from "../hooks/useGameWorld";
import { LinkWorldDialog } from "./LinkWorldDialog";

export interface GameWorldViewProps {
  worldId: string;
}

// The in-game surface for a linked world: the shared WorldPanel plus the
// actions that only make sense from inside a game. The subscription is owned
// higher up (see useListenToGameWorld), so the panel does not open its own.
export function GameWorldView(props: GameWorldViewProps) {
  const { worldId } = props;

  const { t } = useTranslation();
  const confirm = useConfirm();
  const gameId = useGameId();

  const isGuide = useGameStore(
    (store) => store.gamePermissions === GamePermission.Guide,
  );
  const gameWorldId = useGameWorldId();
  const closeTabsMatching = useNotesStore((store) => store.closeTabsMatching);

  const [unlinking, setUnlinking] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const handleUnlink = useCallback(() => {
    // Unlinking never deletes the world; it only removes this game's access.
    confirm({
      title: t("worlds.game.unlink-world", "Unlink World"),
      description: t(
        "worlds.game.unlink-world-confirmation",
        "Unlink this world from the game? The world itself is not deleted, but everyone in this game will lose access to it.",
      ),
      confirmationText: t("worlds.game.unlink-world", "Unlink World"),
    })
      .then((result) => {
        if (!result?.confirmed) {
          return;
        }
        setUnlinking(true);
        WorldsService.unlinkGameFromWorld(gameId)
          .then(() => {
            closeTabsMatching("world", worldId);
          })
          .catch(() => {
            setUnlinking(false);
          });
      })
      .catch(() => {});
  }, [confirm, t, gameId, worldId, closeTabsMatching]);

  // The tab can outlive the link if another guide swaps or unlinks the world
  // while this tab is open; the world store then holds a different world.
  if (gameWorldId !== worldId) {
    return (
      <EmptyState
        title={t("worlds.game.world-unlinked-title", "World Unlinked")}
        message={t(
          "worlds.game.world-unlinked",
          "This world is no longer linked to this game.",
        )}
        sx={{ mt: 4 }}
      />
    );
  }

  return (
    <Box>
      <WorldPanel
        worldId={worldId}
        manageSubscription={false}
        onWorldDeleted={() => closeTabsMatching("world", worldId)}
      />
      {isGuide && (
        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<SwapHorizIcon />}
            disabled={unlinking}
            onClick={() => setLinkDialogOpen(true)}
          >
            {t("worlds.game.change-world", "Change World")}
          </Button>
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<LinkOffIcon />}
            disabled={unlinking}
            onClick={handleUnlink}
          >
            {t("worlds.game.unlink-world", "Unlink World")}
          </Button>
        </Box>
      )}
      {/* Mounted only while open: the dialog loads the user's worlds on mount. */}
      {linkDialogOpen && (
        <LinkWorldDialog open onClose={() => setLinkDialogOpen(false)} />
      )}
    </Box>
  );
}
