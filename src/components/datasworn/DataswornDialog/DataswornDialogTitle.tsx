import { DialogHeader } from "@/components/common/Dialog/DialogHeader";
import { useAppState } from "@/stores/appState.store";
import { IconButton } from "@chakra-ui/react";
import { ChevronLeftIcon } from "lucide-react";
import { PropsWithChildren } from "react";

export function DataswornDialogTitle(props: PropsWithChildren) {
  const { children } = props;

  const previousIds = useAppState(
    (state) => state.dataswornDialogState.previousIds,
  );
  const handleGoToPreviousItem = useAppState(
    (state) => state.prevDataswornDialog,
  );

  return (
    <DialogHeader
      actions={
        previousIds.length > 0 ? (
          <IconButton
            variant="ghost"
            colorPalette={"gray"}
            onClick={handleGoToPreviousItem}
          >
            <ChevronLeftIcon />
          </IconButton>
        ) : undefined
      }
    >
      {children}
    </DialogHeader>
  );
}
