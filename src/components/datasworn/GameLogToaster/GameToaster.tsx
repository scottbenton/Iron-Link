import { IconButton, Portal, Toast, Toaster } from "@chakra-ui/react";
import { XIcon } from "lucide-react";

import { NormalRollActions } from "../GameLog/NormalRollActions";
import { GameLogToast } from "./GameLogToast";
import { gameLogToaster } from "./gameLogToaster";

export function GameToaster() {
  return (
    <Portal>
      <Toaster toaster={gameLogToaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <>
            {toast.meta?.id && toast.meta.log && (
              <Toast.Root
                width={{ md: "sm" }}
                display="flex"
                p={0}
                borderWidth={0}
                bg="transparent"
              >
                <GameLogToast
                  logId={toast.meta.id}
                  initialLog={toast.meta.log}
                  w="100%"
                  flexGrow={1}
                  actions={
                    <>
                      <NormalRollActions roll={toast.meta.log} />
                      <Toast.CloseTrigger asChild>
                        <IconButton
                          variant="subtle"
                          aria-label="Close"
                          colorPalette={"gray"}
                          position="initial"
                        >
                          <XIcon />
                        </IconButton>
                      </Toast.CloseTrigger>
                    </>
                  }
                />
              </Toast.Root>
            )}
          </>
        )}
      </Toaster>
    </Portal>
  );
}
