import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useGameLogStore } from "stores/gameLog.store";

export interface NotificationSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationSettingsDialog = (
  props: NotificationSettingsDialogProps,
) => {
  const { open, onClose } = props;
  const { t } = useTranslation();

  const areNotificationsEnabled = useGameLogStore(
    (store) => store.playSoundOnLog,
  );
  const setNotificationsEnabled = useGameLogStore(
    (store) => store.setPlaySoundOnLog,
  );

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {t("game.notification-settings.dialog-title", "Notification Settings")}
      </DialogTitle>
      <DialogContent>
        <Typography>
          {t(
            "game.notification-settings.dialog-description",
            "Customize your notification settings for the game.",
          )}
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={areNotificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
            />
          }
          label={t(
            "game.notification-settings.notification-enabled",
            "Play sound on new messages in the game log.",
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="primary" onClick={onClose}>
          {t("common.done", "Done")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
