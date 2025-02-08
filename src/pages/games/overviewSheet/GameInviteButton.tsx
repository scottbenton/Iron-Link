import CopyIcon from "@mui/icons-material/FileCopy";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { GamePermission, useGameStore } from "stores/game.store";

import { GameType } from "repositories/game.repository";

import { useGameId } from "../gamePageLayout/hooks/useGameId";
import { useGamePermissions } from "../gamePageLayout/hooks/usePermissions";

export function GameInviteButton() {
  const { t } = useTranslation();

  const gameId = useGameId();
  const { gameType, gamePermission } = useGamePermissions();

  const loadGameInviteKey = useGameStore((state) => state.getGameInviteKey);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [inviteKey, setInviteKey] = useState<string | null>(null);
  const [inviteKeyLoading, setInviteKeyLoading] = useState(true);
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
          setInviteKeyLoading(false);
        })
        .catch(() => {
          setInviteKeyLoading(false);
          setInviteKeyError(
            t("game.invite.error", "Failed to load invite key"),
          );
        });
    };

    handleFetchInviteKey();
  }, [gameId, t, loadGameInviteKey]);

  const { success } = useSnackbar();
  const handleCopy = useCallback(() => {
    if (!inviteKey) return;
    const inviteLink = inviteURL + inviteKey;
    navigator.clipboard.writeText(inviteLink).then(() => {
      success("Copied URL to clipboard");
    });
  }, [inviteURL, inviteKey, success]);

  return (
    <>
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitleWithCloseButton onClose={() => setIsDialogOpen(false)}>
          {t("game.invite.title", "Invite to game")}
        </DialogTitleWithCloseButton>

        <DialogContent>
          <Typography>
            {t(
              "game.invite.copyUrl",
              "Copy this URL to invite others to the game",
            )}
          </Typography>
          {inviteKeyLoading && <Skeleton variant="text" />}

          {inviteKeyError && (
            <Alert severity="error">
              {t("game.invite.error", "Failed to load invite key")}
            </Alert>
          )}

          {inviteKey && (
            <Box
              display="flex"
              alignItems="center"
              bgcolor="background.default"
              p={1}
              borderRadius={1}
            >
              <Typography
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                {inviteURL}
                {inviteKey}
              </Typography>
              <Tooltip title={t("common.copy", "Copy")}>
                <IconButton onClick={handleCopy}>
                  <CopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            variant="contained"
            onClick={() => setIsDialogOpen(false)}
          >
            {t("common.done", "Done")}
          </Button>
        </DialogActions>
      </Dialog>

      {gamePermission !== GamePermission.Viewer &&
        gameType !== GameType.Solo && (
          <Button
            variant="outlined"
            color="inherit"
            sx={{ mt: 1 }}
            onClick={() => setIsDialogOpen(true)}
          >
            {t("game.overview.invite", "Copy Invite Link")}
          </Button>
        )}
    </>
  );
}
