import { SnackbarProvider as NotistackSnackbarProvider } from "notistack";
import { PropsWithChildren } from "react";

import { Snackbar } from "./Snackbar";

export function SnackbarProvider(props: PropsWithChildren) {
  const { children } = props;

  return (
    <NotistackSnackbarProvider
      maxSnack={3}
      // Long enough to reach with a screen reader; errors stay until
      // dismissed (see createErrorSnackbar).
      autoHideDuration={10000}
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
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
  );
}
