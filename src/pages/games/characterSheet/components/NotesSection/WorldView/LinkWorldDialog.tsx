import PublicIcon from "@mui/icons-material/Public";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";
import { CreateWorldForm } from "components/worlds/CreateWorldForm";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useNotesStore } from "stores/notes.store";
import { useLoadUsersWorlds, useUsersWorlds } from "stores/users.worlds.store";

import { getWorldSettingLabel } from "lib/worldSettings";

import { WorldsService } from "services/worlds.service";

import { useGameWorldId } from "../hooks/useGameWorld";

export interface LinkWorldDialogProps {
  open: boolean;
  onClose: () => void;
}

// Linking and creating are one user intent ("give this game a world"), so they
// share a dialog: the list is the default, and creating drops the new world
// straight into the game without leaving the session.
export function LinkWorldDialog(props: LinkWorldDialogProps) {
  const { open, onClose } = props;

  const { t } = useTranslation();
  const confirm = useConfirm();
  const gameId = useGameId();

  // Not otherwise loaded inside a game.
  useLoadUsersWorlds();
  const worlds = useUsersWorlds((store) => store.worlds);
  const worldsLoading = useUsersWorlds((store) => store.loading);

  const currentWorldId = useGameWorldId();
  const openItemTab = useNotesStore((store) => store.openItemTab);
  const closeTabsMatching = useNotesStore((store) => store.closeTabsMatching);

  const [mode, setMode] = useState<"link" | "create">("link");
  const [linkingWorldId, setLinkingWorldId] = useState<string | null>(null);

  // Worlds the user can only reach through a linked game (role null) are left
  // out: linking is the one operation that adds an audience to a world, so the
  // RPC requires explicit rights and would reject them.
  const eligibleWorlds = useMemo(
    () =>
      Object.entries(worlds)
        .filter(
          ([worldId, world]) =>
            worldId !== currentWorldId &&
            (world.role === "owner" || world.role === "editor"),
        )
        .sort(([, a], [, b]) => a.name.localeCompare(b.name)),
    [worlds, currentWorldId],
  );

  const handleClose = useCallback(() => {
    setMode("link");
    onClose();
  }, [onClose]);

  const linkWorld = useCallback(
    (worldId: string) => {
      setLinkingWorldId(worldId);
      // The result carries divergences for a later task; nothing reads it yet.
      WorldsService.linkGameToWorld(gameId, worldId)
        .then(() => {
          setLinkingWorldId(null);
          if (currentWorldId && currentWorldId !== worldId) {
            closeTabsMatching("world", currentWorldId);
          }
          openItemTab({
            type: "world",
            id: worldId,
            replaceCurrent: false,
            disallowDuplicates: true,
          });
          handleClose();
        })
        .catch(() => {
          setLinkingWorldId(null);
        });
    },
    [gameId, currentWorldId, closeTabsMatching, openItemTab, handleClose],
  );

  const handleSelectWorld = useCallback(
    (worldId: string, worldName: string) => {
      if (!currentWorldId) {
        linkWorld(worldId);
        return;
      }
      // Access to a world is derived from the game link, so swapping really
      // does take the current world away from everyone in this game.
      confirm({
        title: t("worlds.link.change-world", "Change World"),
        description: t(
          "worlds.link.change-world-confirmation",
          'Link "{{worldName}}" to this game instead? Everyone in this game will lose access to the world currently linked here.',
          { worldName },
        ),
        confirmationText: t("worlds.link.change-world", "Change World"),
      })
        .then((result) => {
          if (result?.confirmed) {
            linkWorld(worldId);
          }
        })
        .catch(() => {});
    },
    [confirm, t, currentWorldId, linkWorld],
  );

  const hasEligibleWorlds = eligibleWorlds.length > 0;
  // With nothing to pick from, the list would be an empty panel in front of
  // the only useful action.
  const showCreate =
    mode === "create" || (!worldsLoading && !hasEligibleWorlds);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitleWithCloseButton onClose={handleClose}>
        {showCreate
          ? t("worlds.link.create-world-title", "Create a World")
          : currentWorldId
            ? t("worlds.link.change-world", "Change World")
            : t("worlds.link.link-world-title", "Link a World")}
      </DialogTitleWithCloseButton>
      <DialogContent>
        {showCreate ? (
          <CreateWorldForm
            onCreated={linkWorld}
            onCancel={hasEligibleWorlds ? () => setMode("link") : handleClose}
          />
        ) : worldsLoading ? (
          <LinearProgress />
        ) : (
          // Existing worlds and the create action share one panel, matching the
          // world chooser in Iron Fellowship / Crew Link: picking an existing
          // world and making a new one are the same intent, so hiding one of
          // them behind a dialog action makes it read as an afterthought.
          <Stack spacing={2} sx={{ pt: 1, pb: 2 }}>
            <Typography color="text.secondary">
              {t("worlds.link.add-existing-world", "Add an existing world")}
            </Typography>
            {eligibleWorlds.map(([worldId, world]) => (
              <Card variant="outlined" key={worldId}>
                <CardActionArea
                  disabled={linkingWorldId !== null}
                  onClick={() => handleSelectWorld(worldId, world.name)}
                  sx={{
                    p: 2,
                    display: "flex",
                    // CardActionArea is a ButtonBase, which centres its content
                    // by default -- without this the world name sits in the
                    // middle of the card instead of reading as a list row.
                    justifyContent: "flex-start",
                    alignItems: "center",
                    textAlign: "left",
                    gap: 1.5,
                  }}
                >
                  <PublicIcon color="action" />
                  <Box>
                    <Typography component="span" display="block">
                      {world.name}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      variant="caption"
                      component="span"
                      display="block"
                    >
                      {world.settingKey
                        ? getWorldSettingLabel(world.settingKey)
                        : t("worlds.link.no-setting", "No setting")}
                    </Typography>
                  </Box>
                </CardActionArea>
              </Card>
            ))}
            <Divider sx={{ my: 3 }}>{t("common.or", "OR")}</Divider>
            <Box display="flex" alignItems="center" justifyContent="center">
              <Button
                variant="contained"
                disabled={linkingWorldId !== null}
                onClick={() => setMode("create")}
              >
                {t("worlds.link.create-new-world", "Create a new World")}
              </Button>
            </Box>
          </Stack>
        )}
      </DialogContent>
      {/* Create mode carries its own Cancel inside CreateWorldForm, so this
          would be a second one sitting right beneath it. */}
      {!showCreate && (
        <DialogActions>
          <Button color="inherit" onClick={handleClose}>
            {t("common.cancel", "Cancel")}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
