import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useUID } from "stores/auth.store";
import { useUsersStore } from "stores/users.store";

export interface UserNameDialogProps {
  open: boolean;
  initialName?: string;
}

export function UserNameDialog(props: UserNameDialogProps) {
  const { open, initialName = "" } = props;
  const uid = useUID();

  const { t } = useTranslation();

  const [name, setName] = useState(initialName);
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleNameChange = useUsersStore((store) => store.setUserName);
  const handleSave = useCallback(() => {
    if (uid && name.trim()) {
      handleNameChange(uid, name.trim())
        .then(() => {})
        .catch(() => {});
    }
  }, [name, handleNameChange, uid]);

  return (
    <Dialog open={!!uid && open}>
      <DialogTitle>
        {t("layout.userNameDialog.title", "Set your name")}
      </DialogTitle>
      <DialogContent>
        <Typography>
          {t(
            "layout.userNameDialog.content",
            "Your name will be visible to other players in games.",
          )}
        </Typography>
        <TextField
          label={t("layout.userNameDialog.nameLabel", "Name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant={"contained"}
          disabled={!name.trim()}
          onClick={handleSave}
        >
          {t("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
