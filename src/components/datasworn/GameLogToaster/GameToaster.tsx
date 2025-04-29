import { Portal, Toast, Toaster } from "@chakra-ui/react";

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
                />
              </Toast.Root>
            )}
          </>
        )}
      </Toaster>
    </Portal>
  );
}
