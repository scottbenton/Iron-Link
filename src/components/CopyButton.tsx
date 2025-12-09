import CopyIcon from "@mui/icons-material/CopyAll";
import {
  Alert,
  Box,
  Button,
  ButtonProps,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { DialogTitleWithCloseButton } from "./DialogTitleWithCloseButton";

export interface CopyButtonProps extends Omit<ButtonProps, "onClick"> {
  link?: string;
  error?: string;
  dialogTitle: string;
  dialogContent?: string;
}

export function CopyButton(props: CopyButtonProps) {
  const { link, error, dialogTitle, dialogContent, ...buttonProps } = props;

  const { t } = useTranslation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { success } = useSnackbar();

  const handleCopy = useCallback(() => {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      success(t("common.url-copy.success", "Copied URL to clipboard"));
    });
  }, [link, success, t]);

  return (
    <>
      <Button {...buttonProps} onClick={() => setIsDialogOpen(true)} />
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitleWithCloseButton onClose={() => setIsDialogOpen(false)}>
          {dialogTitle}
        </DialogTitleWithCloseButton>

        <DialogContent>
          {dialogContent && <Typography>{dialogContent}</Typography>}
          {!link && <Skeleton variant="text" />}

          {error && <Alert severity="error">{error}</Alert>}

          {link && (
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
                {link}
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
    </>
  );
}
