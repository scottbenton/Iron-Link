import { useTranslation } from "react-i18next";

import { DialogHeader } from "ui/components/Dialog";
import { IconButton } from "ui/components/IconButton";
import { CaretLeftIcon } from "ui/icons";

import { useAppState } from "stores/appState.store";

export interface DataswornDialogTitleProps {
  children: string;
}

// The dialog's title, with a way back to the item this one was opened from.
export function DataswornDialogTitle(props: DataswornDialogTitleProps) {
  const { children } = props;
  const { t } = useTranslation();

  const previousIds = useAppState(
    (state) => state.dataswornDialogState.previousIds,
  );
  const handleGoToPreviousItem = useAppState(
    (state) => state.prevDataswornDialog,
  );

  return (
    <DialogHeader
      title={children}
      actions={
        previousIds.length > 0 ? (
          <IconButton
            label={t("datasworn.dialog.previous", "Back to previous item")}
            tooltipSide="bottom"
            onClick={handleGoToPreviousItem}
          >
            <CaretLeftIcon />
          </IconButton>
        ) : undefined
      }
    />
  );
}
