import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { WorldConfigurationDeleteRequest } from "./useWorldConfigurationDeleteConfirmation";

export function WorldConfigurationDeleteDialog({
  request,
  onAnswer,
}: {
  request: WorldConfigurationDeleteRequest | undefined;
  onAnswer: (confirmed: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog
      open={Boolean(request)}
      onClose={() => onAnswer(false)}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitleWithCloseButton onClose={() => onAnswer(false)}>
        {request?.title}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <DialogContentText>{request?.description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onAnswer(false)}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => onAnswer(true)}
        >
          {request?.confirmationText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
