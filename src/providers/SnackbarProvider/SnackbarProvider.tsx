import { GlobalStyles } from "@mui/material";
import { SnackbarProvider as NotistackSnackbarProvider } from "notistack";
import { PropsWithChildren } from "react";

import { ROLL_DOCK_HEIGHT_PROPERTY } from "components/characters/rolls/usePublishRollDockHeight";
import {
  ROLL_DOCK_GAP,
  ROLL_DOCK_WIDE_INSET,
  useRollDockPosition,
} from "components/characters/rolls/useRollDockPosition";

import { Snackbar } from "./Snackbar";

// The space notistack leaves above and below each snackbar, inside its
// container; taken off the container's bottom so a snackbar's edge lines up.
const SNACKBAR_WRAPPER_PADDING = 6;

export function SnackbarProvider(props: PropsWithChildren) {
  const { children } = props;
  const { isMobile, bottom } = useRollDockPosition();

  // Snackbars stack above the recent rolls, which publish their height: where
  // the first roll would appear with none, a gap above the stack otherwise.
  const rollDockHeight = `var(${ROLL_DOCK_HEIGHT_PROPERTY}, 0px)`;
  const snackbarBottom = `calc(${bottom} + ${rollDockHeight} + min(${rollDockHeight}, ${ROLL_DOCK_GAP}px) - ${SNACKBAR_WRAPPER_PADDING}px)`;

  return (
    <>
      <GlobalStyles
        styles={{
          // Doubled to outrank notistack's own class.
          ".notistack-SnackbarContainer.notistack-SnackbarContainer": {
            bottom: snackbarBottom,
            ...(!isMobile && { right: ROLL_DOCK_WIDE_INSET }),
          },
        }}
      />
      <NotistackSnackbarProvider
        maxSnack={3}
        // Long enough to reach with a screen reader; errors stay until
        // dismissed (see createErrorSnackbar).
        autoHideDuration={10000}
        // Over the roll stack: centred on phones, where it is full width, and
        // in the bottom right corner otherwise.
        anchorOrigin={{
          horizontal: isMobile ? "center" : "right",
          vertical: "bottom",
        }}
        preventDuplicate
        Components={{
          info: Snackbar,
          success: Snackbar,
          warning: Snackbar,
          error: Snackbar,
        }}
      >
        {children}
      </NotistackSnackbarProvider>
    </>
  );
}
