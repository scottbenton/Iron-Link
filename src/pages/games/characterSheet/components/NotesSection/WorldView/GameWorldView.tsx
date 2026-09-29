import LinkOffIcon from "@mui/icons-material/LinkOff";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { Box, Button, Typography } from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import type { BreadcrumbItem } from "components/Layout/BreadcrumbTrail";
import { EmptyState } from "components/Layout/EmptyState";
import { WorldPanel } from "components/worlds/WorldPanel";
import type {
  WorldNavigation,
  WorldView,
} from "components/worlds/worldNavigation";

import { getNotesItemLinkProps } from "pages/games/gamePageLayout/hooks/notesDestination";
import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useUID } from "stores/auth.store";
import { GamePermission, useGameStore } from "stores/game.store";
import { getPlayerNotesFolder, useNotesStore } from "stores/notes.store";

import { WorldsService } from "services/worlds.service";

import { useGameWorldId } from "../hooks/useGameWorld";
import { LinkWorldDialog } from "./LinkWorldDialog";

export interface GameWorldViewProps {
  worldId: string;
  worldView?: WorldView;
}

// The in-game surface for a linked world: the shared WorldPanel plus the
// actions that only make sense from inside a game. The subscription is owned
// higher up (see useListenToGameWorld), so the panel does not open its own.
export function GameWorldView(props: GameWorldViewProps) {
  const { worldId, worldView = { type: "world" } } = props;

  const { t } = useTranslation();
  const confirm = useConfirm();
  const gameId = useGameId();
  const location = useLocation();
  const uid = useUID();
  const openItemTab = useNotesStore((store) => store.openItemTab);
  const rootFolder = useNotesStore((store) =>
    uid ? getPlayerNotesFolder(uid, store.folderState.folders) : undefined,
  );
  const navigation: WorldNavigation = {
    view: worldView,
    navigate: (view) =>
      openItemTab({ type: "world", id: worldId, worldView: view }),
    getLinkProps: (view) =>
      getNotesItemLinkProps(
        location.pathname,
        new URLSearchParams(location.search),
        { type: "world", itemId: worldId, worldView: view },
        (item, background) =>
          openItemTab({
            type: item.type,
            id: item.itemId,
            worldView: item.worldView,
            replaceCurrent: !background,
            openInBackground: background,
          }),
      ),
  };
  const rootBreadcrumb: BreadcrumbItem | undefined = rootFolder
    ? {
        key: rootFolder.id,
        label: t("notes.user-folder", "Notes"),
        linkProps: getNotesItemLinkProps(
          location.pathname,
          new URLSearchParams(location.search),
          { type: "folder", itemId: rootFolder.id },
          (item, background) =>
            openItemTab({
              type: item.type,
              id: item.itemId,
              replaceCurrent: !background,
              openInBackground: background,
            }),
        ),
      }
    : undefined;

  const isGuide = useGameStore(
    (store) => store.gamePermissions === GamePermission.Guide,
  );
  const gameWorldId = useGameWorldId();
  const closeTabsMatching = useNotesStore((store) => store.closeTabsMatching);

  const activeContext = useRef({ gameId, gameWorldId, isGuide, mounted: true });
  activeContext.current = {
    ...activeContext.current,
    gameId,
    gameWorldId,
    isGuide,
  };
  useEffect(() => {
    activeContext.current.mounted = true;
    return () => {
      activeContext.current.mounted = false;
    };
  }, []);

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
        const current = activeContext.current;
        if (
          !result?.confirmed ||
          !current.mounted ||
          !current.isGuide ||
          current.gameId !== gameId ||
          current.gameWorldId !== worldId
        ) {
          return;
        }
        setUnlinking(true);
        WorldsService.unlinkGameFromWorld(gameId)
          .then(() => {
            const completed = activeContext.current;
            if (completed.mounted && completed.gameId === gameId)
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
        navigation={navigation}
        rootBreadcrumb={rootBreadcrumb}
        onWorldDeleted={() => closeTabsMatching("world", worldId)}
        additionalSettings={
          isGuide ? (
            <Box>
              <Typography variant="h6" component="h3">
                {t("worlds.game.connection", "Game connection")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t(
                  "worlds.game.connection-help",
                  "Choose which world this game uses, or unlink it. The world itself is kept.",
                )}
              </Typography>
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
            </Box>
          ) : undefined
        }
      />
      {/* Mounted only while open: the dialog loads the user's worlds on mount. */}
      {linkDialogOpen && (
        <LinkWorldDialog open onClose={() => setLinkDialogOpen(false)} />
      )}
    </Box>
  );
}
