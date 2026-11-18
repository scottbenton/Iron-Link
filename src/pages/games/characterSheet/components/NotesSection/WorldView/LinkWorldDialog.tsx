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
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";
import { CreateWorldForm } from "components/worlds/CreateWorldForm";
import { useWorldOracleChangesDialog } from "components/worlds/oracleChanges/useWorldOracleChangesDialog";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useGameStore } from "stores/game.store";
import { useNotesStore } from "stores/notes.store";
import { useLoadUsersWorlds, useUsersWorlds } from "stores/users.worlds.store";

import { getWorldSettingLabel } from "lib/worldSettings";

import { WorldOracleChangesService } from "services/worldOracleChanges.service";
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
  const gameId = useGameId();
  const game = useGameStore((store) => store.game);

  // Not otherwise loaded inside a game.
  useLoadUsersWorlds();
  const worlds = useUsersWorlds((store) => store.worlds);
  const worldsLoading = useUsersWorlds((store) => store.loading);

  const currentWorldId = useGameWorldId();
  const openItemTab = useNotesStore((store) => store.openItemTab);
  const closeTabsMatching = useNotesStore((store) => store.closeTabsMatching);

  const [mode, setMode] = useState<"link" | "create">("link");
  const [linkingWorldId, setLinkingWorldId] = useState<string | null>(null);
  const { confirm: confirmOracleChanges, dialog: oracleChangesDialog } =
    useWorldOracleChangesDialog();

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

  const gameRules = useMemo(
    () => ({
      rulesets: game?.rulesets ?? {},
      expansions: game?.expansions ?? {},
      playset: game?.playset ?? {},
    }),
    [game?.rulesets, game?.expansions, game?.playset],
  );

  // Linking adds this game's rules to the world's playsets, and changing
  // world takes them away from the old one, so either can move what world
  // fields roll. The shared dialog lists those fields; changing world also
  // needs confirming, since it takes the old world away from everyone here.
  const linkWorld = useCallback(
    (worldId: string, worldName: string) => {
      const changingWorld = !!currentWorldId && currentWorldId !== worldId;
      setLinkingWorldId(worldId);
      confirmOracleChanges({
        title: changingWorld
          ? t("worlds.link.change-world", "Change World")
          : t("worlds.link.link-world-title", "Link a World"),
        description: changingWorld
          ? t(
              "worlds.link.change-world-confirmation",
              'Link "{{worldName}}" to this game instead? Everyone in this game will lose access to the world currently linked here.',
              { worldName },
            )
          : undefined,
        confirmLabel: changingWorld
          ? t("worlds.link.change-world", "Change World")
          : t("worlds.link.link-world", "Link World"),
        alwaysConfirm: changingWorld,
        loadPreviews: () =>
          Promise.all([
            WorldOracleChangesService.previewLink(worldId, gameRules),
            ...(changingWorld && currentWorldId
              ? [
                  WorldOracleChangesService.previewUnlink(
                    currentWorldId,
                    gameRules,
                  ),
                ]
              : []),
          ]),
        save: async (changes) => {
          await WorldsService.linkGameToWorld(gameId, worldId, changes);
        },
      })
        .then((saved) => {
          setLinkingWorldId(null);
          if (!saved) return;
          if (changingWorld && currentWorldId) {
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
    [
      t,
      gameId,
      gameRules,
      currentWorldId,
      confirmOracleChanges,
      closeTabsMatching,
      openItemTab,
      handleClose,
    ],
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
            creationGame={game ?? undefined}
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
                  onClick={() => linkWorld(worldId, world.name)}
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
      {oracleChangesDialog}
    </Dialog>
  );
}
