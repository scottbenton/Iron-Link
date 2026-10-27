import InsertSecretIcon from "@mui/icons-material/EnhancedEncryptionOutlined";
import MakeSecretIcon from "@mui/icons-material/VisibilityOffOutlined";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  SxProps,
  Theme,
  ToggleButton,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import type { SecretsToolbarState } from "../richTextToolbar";

export interface SecretToolbarButtonProps {
  secrets: SecretsToolbarState;
  sx?: SxProps<Theme>;
}

// Insert secret, for Guides: adds an empty block at the caret. A button in
// the toolbar's insert group, not an on/off toggle.
export function InsertSecretButton(props: SecretToolbarButtonProps) {
  const { secrets, sx } = props;
  const { t } = useTranslation();
  const label = t("notes.secrets.insert", "Insert secret");

  return (
    <Tooltip title={label} enterDelay={300}>
      <ToggleButton
        size="small"
        value="insert secret"
        // An action, not an on/off state.
        aria-pressed={undefined}
        aria-label={label}
        // Keep the caret in the note.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => secrets.insertSecret()}
        sx={sx}
      >
        <InsertSecretIcon />
      </ToggleButton>
    </Tooltip>
  );
}

// Make secret, for Guides: moves the selected text into a new block, after
// warning that players may already have seen it.
export function MakeSecretButton(props: SecretToolbarButtonProps) {
  const { secrets, sx } = props;
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const label = t("notes.secrets.make", "Make secret");

  return (
    <>
      <Tooltip title={label} enterDelay={300}>
        <ToggleButton
          size="small"
          value="make secret"
          // An action, not an on/off state.
          aria-pressed={undefined}
          aria-label={label}
          // Keep the selection in the note while the dialog opens.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setConfirmOpen(true)}
          sx={sx}
        >
          <MakeSecretIcon />
        </ToggleButton>
      </Tooltip>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitleWithCloseButton onClose={() => setConfirmOpen(false)}>
          {label}
        </DialogTitleWithCloseButton>
        <DialogContent>
          <DialogContentText>
            {t(
              "notes.secrets.make-warning",
              "Players may already have seen this. The text moves into a secret only Guides can read, but anyone who opened the note before now has already seen it.",
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setConfirmOpen(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfirmOpen(false);
              secrets.makeSecret();
            }}
          >
            {label}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
