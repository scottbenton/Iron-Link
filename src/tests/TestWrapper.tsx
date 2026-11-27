import { PropsWithChildren } from "react";

import { AppUIProvider } from "providers/AppUIProvider";
import { ThemeProvider } from "providers/ThemeProvider";

export function TestWrapper(props: PropsWithChildren) {
  const { children } = props;
  return (
    <ThemeProvider>
      <AppUIProvider>{children}</AppUIProvider>
    </ThemeProvider>
  );
}
