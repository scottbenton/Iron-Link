import { PropsWithChildren } from "react";

import { AppUIProvider } from "providers/AppUIProvider";
import { SnackbarProvider } from "providers/SnackbarProvider";
import { ThemeProvider } from "providers/ThemeProvider";

export function TestWrapper(props: PropsWithChildren) {
  const { children } = props;
  return (
    <ThemeProvider>
      <AppUIProvider>
        <SnackbarProvider>{children}</SnackbarProvider>
      </AppUIProvider>
    </ThemeProvider>
  );
}
