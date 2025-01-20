import { ConfirmProvider } from "material-ui-confirm";
import { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter } from "react-router";

import { HeadProvider } from "./HeadProvider";
import { SnackbarProvider } from "./SnackbarProvider";
import { ThemeProvider } from "./ThemeProvider";

export function Providers(props: PropsWithChildren) {
  const { children } = props;
  const { t } = useTranslation();

  return (
    <ThemeProvider>
      <HeadProvider>
        <ConfirmProvider
          defaultOptions={{
            cancellationText: t("common.cancel", "Cancel"),
            cancellationButtonProps: { color: "inherit" },
            confirmationButtonProps: {
              variant: "contained",
              color: "error",
            },
          }}
        >
          <SnackbarProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </SnackbarProvider>
        </ConfirmProvider>
      </HeadProvider>
    </ThemeProvider>
  );
}
