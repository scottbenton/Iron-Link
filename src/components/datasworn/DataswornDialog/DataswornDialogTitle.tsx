import { useAppState } from "@/stores/appState.store";
import { Dialog, IconButton } from "@chakra-ui/react";
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
    <Dialog.Header>
      <Dialog.Title
        display="flex"
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        {children}
        {previousIds.length > 0 ? (
          <IconButton
            variant="ghost"
            colorPalette={"gray"}
            onClick={handleGoToPreviousItem}
          >
            <ChevronLeftIcon />
          </IconButton>
        ) : undefined}
      </Dialog.Title>
    </Dialog.Header>
  );
}
