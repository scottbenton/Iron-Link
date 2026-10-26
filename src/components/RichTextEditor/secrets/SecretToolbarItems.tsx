import InsertSecretIcon from "@mui/icons-material/EnhancedEncryptionOutlined";
import LockIcon from "@mui/icons-material/LockOutlined";
import MakeSecretIcon from "@mui/icons-material/VisibilityOffOutlined";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import type { SecretsToolbarState } from "../richTextToolbar";

export interface SecretToolbarItemsProps {
  secrets: SecretsToolbarState;
}

// The toolbar's secret controls, for Guides: a Secret label while the caret
// is in a block, then Make secret and Insert secret.
export function SecretToolbarItems(props: SecretToolbarItemsProps) {
  const { secrets } = props;
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const insertLabel = t("notes.secrets.insert", "Insert secret");
  const makeLabel = t("notes.secrets.make", "Make secret");

  return (
    <>
      {secrets.inSecret && (
        <Chip
          size="small"
          variant="outlined"
          icon={<LockIcon />}
          label={t("notes.secrets.label", "Secret")}
        />
      )}
      {secrets.canMakeSecret && (
        <Tooltip title={makeLabel} enterDelay={300}>
          <IconButton
            aria-label={makeLabel}
            // Keep the selection in the note while the dialog opens.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setConfirmOpen(true)}
          >
            <MakeSecretIcon />
          </IconButton>
        </Tooltip>
      )}
      {secrets.canInsert && (
        <Tooltip title={insertLabel} enterDelay={300}>
          <IconButton
            aria-label={insertLabel}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => secrets.insertSecret()}
          >
            <InsertSecretIcon />
          </IconButton>
        </Tooltip>
      )}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitleWithCloseButton onClose={() => setConfirmOpen(false)}>
          {makeLabel}
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
            {makeLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
