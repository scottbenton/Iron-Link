import PreviousIcon from "@mui/icons-material/ChevronLeft";
import { IconButton } from "@mui/material";
import { PropsWithChildren } from "react";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { useAppState } from "stores/appState.store";

export function DataswornDialogTitle(props: PropsWithChildren) {
  const { children } = props;

  const previousIds = useAppState(
    (state) => state.dataswornDialogState.previousIds,
  );
  const handleClose = useAppState((state) => state.closeDataswornDialog);
  const handleGoToPreviousItem = useAppState(
    (state) => state.prevDataswornDialog,
  );

  return (
    <DialogTitleWithCloseButton
      actions={
        previousIds.length > 0 ? (
          <IconButton onClick={handleGoToPreviousItem}>
            <PreviousIcon />
          </IconButton>
        ) : undefined
      }
      onClose={handleClose}
    >
      {children}
    </DialogTitleWithCloseButton>
  );
}
