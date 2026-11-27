import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "ui/components/Alert";
import { Button } from "ui/components/Button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogHeader,
} from "ui/components/Dialog";
import { TextField } from "ui/components/TextField";
import { Stack } from "ui/primitives";

import { useUID } from "stores/auth.store";
import { useUsersStore } from "stores/users.store";

export interface UserNameDialogProps {
  open: boolean;
  initialName?: string;
}

/**
 * Asks a signed in person with no name for one. It can't be closed without
 * saving, since games show this name to other players.
 */
export function UserNameDialog(props: UserNameDialogProps) {
  const { open, initialName = "" } = props;
  const uid = useUID();

  const { t } = useTranslation();

  const [name, setName] = useState(initialName);
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const setUserName = useUsersStore((store) => store.setUserName);
  const trimmedName = name.trim();

  const handleSave = () => {
    if (!uid || !trimmedName || saving) return;
    setSaving(true);
    setFailed(false);
    setUserName(uid, trimmedName)
      .catch(() => setFailed(true))
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open={!!uid && open} onClose={() => {}} onSubmit={handleSave}>
      <DialogHeader
        title={t("layout.userNameDialog.title", "Set your name")}
        hideClose
      />
      <DialogBody>
        <Stack gap="4">
          <DialogDescription>
            {t(
              "layout.userNameDialog.content",
              "Your name will be visible to other players in games.",
            )}
          </DialogDescription>
          {failed && (
            <Alert tone="danger">
              {t(
                "layout.userNameDialog.error",
                "Your name could not be saved. Try again.",
              )}
            </Alert>
          )}
          <TextField
            label={t("layout.userNameDialog.nameLabel", "Name")}
            value={name}
            onValueChange={setName}
            required
          />
        </Stack>
      </DialogBody>
      <DialogActions>
        <Button
          type="submit"
          variant="primary"
          disabled={!trimmedName}
          loading={saving}
          loadingLabel={t("common.saving", "Saving")}
        >
          {t("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
