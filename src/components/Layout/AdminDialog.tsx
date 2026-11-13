import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useState } from "react";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { useAdminStore } from "stores/admin.store";

import { getDialogFormSlotProps } from "lib/dialogForm.lib";

export interface AdminDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AdminDialog(props: AdminDialogProps) {
  const { open, onClose } = props;

  const getMagicLink = useAdminStore((state) => state.getMagicLink);

  const [email, setEmail] = useState<string | undefined>(undefined);
  const [uid, setUid] = useState<string | undefined>(undefined);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetLink = (evt: FormEvent) => {
    evt.preventDefault();
    setError(null);
    getMagicLink(uid || undefined, email || undefined)
      .then((link) => {
        setMagicLink(link);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={getDialogFormSlotProps(handleGetLink)}
    >
      <DialogTitleWithCloseButton onClose={onClose}>
        Admin Actions
      </DialogTitleWithCloseButton>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="overline">Get Magic Link</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={"UID"}
            value={uid ?? null}
            onChange={(e) => setUid(e.target.value)}
          />
          <TextField
            label={"Email"}
            value={email ?? null}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" variant="contained">
            Get Magic Link
          </Button>
          {magicLink && (
            <Typography variant="body1">Magic Link: {magicLink}</Typography>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
