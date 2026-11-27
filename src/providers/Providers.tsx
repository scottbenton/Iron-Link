import { PropsWithChildren } from "react";
import { BrowserRouter } from "react-router";

import { AppUIProvider } from "./AppUIProvider";
import { HeadProvider } from "./HeadProvider";
import { ThemeProvider } from "./ThemeProvider";

export function Providers(props: PropsWithChildren) {
  const { children } = props;

  return (
    <ThemeProvider>
      <HeadProvider>
        <BrowserRouter>
          <AppUIProvider>{children}</AppUIProvider>
        </BrowserRouter>
      </HeadProvider>
    </ThemeProvider>
  );
}
