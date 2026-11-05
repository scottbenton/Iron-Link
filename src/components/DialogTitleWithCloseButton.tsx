import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  DialogTitle,
  IconButton,
  dialogTitleClasses,
} from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { LiveRegion } from "./Layout/LiveRegion";

export interface DialogTitleWithCloseButtonProps extends PropsWithChildren {
  onClose: () => void;
  actions?: ReactNode;
}
export function DialogTitleWithCloseButton(
  props: DialogTitleWithCloseButtonProps,
) {
  const { children, actions, onClose } = props;

  const { t } = useTranslation();

  return (
    <>
      <LiveRegion />
      {/* The dialog is named by DialogTitle's id, so only the heading is a
          DialogTitle and the buttons sit beside it; otherwise the dialog's
          name would end in "Close Dialog". The wrapper keeps the title class
          so DialogContent still drops its top padding after it. */}
      <Box
        className={dialogTitleClasses.root}
        display={"flex"}
        alignItems={"center"}
        justifyContent={"space-between"}
        flex={"0 0 auto"}
        px={3}
        py={2}
      >
        <DialogTitle component={"h2"} sx={{ p: 0 }}>
          {children}
        </DialogTitle>
        <Box display={"flex"} alignItems={"center"} flexShrink={0} ml={1}>
          {actions}
          <IconButton
            aria-label={t("common.close-dialog", "Close Dialog")}
            onClick={() => onClose()}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
    </>
  );
}
