import { PropsWithChildren } from "react";
import { ThemeProvider } from "./ThemeProvider";

export function Providers(props: PropsWithChildren) {
  const { children } = props;

  return <ThemeProvider>{children}</ThemeProvider>;
}
