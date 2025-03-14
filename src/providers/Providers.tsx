import { PropsWithChildren } from "react";

import { ConfirmProvider } from "./ConfirmProvider";
import { ThemeProvider } from "./ThemeProvider";

export function Providers(props: PropsWithChildren) {
  const { children } = props;

  return (
    <ThemeProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ThemeProvider>
  );
}
