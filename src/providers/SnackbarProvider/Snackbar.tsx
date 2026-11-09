import { Alert } from "@mui/material";
import { CustomContentProps } from "notistack";
import { closeSnackbar } from "notistack";
import { ForwardedRef, forwardRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useSetAnnouncement } from "stores/appState.store";

const SnackbarComponent = (
  props: CustomContentProps,
  ref: ForwardedRef<HTMLDivElement>,
) => {
  const { message, variant, action, id, style } = props;
  const { t } = useTranslation();

  // Read through the app's live region rather than as an alert of its own:
  // snackbars render outside any open dialog, and a modal dialog hides
  // everything outside it from screen readers, its own region aside.
  const announce = useSetAnnouncement();
  useEffect(() => {
    if (typeof message === "string") {
      announce(message);
    }
  }, [announce, message]);

  return (
    <Alert
      key={id}
      style={style}
      ref={ref}
      severity={variant === "default" ? "info" : variant}
      variant={"filled"}
      role={"status"}
      aria-live={typeof message === "string" ? "off" : "polite"}
      closeText={t("common.dismiss-notification", "Dismiss notification")}
      action={typeof action === "function" ? action(id) : action}
      onClose={() => closeSnackbar(id)}
    >
      {message}
    </Alert>
  );
};

export const Snackbar = forwardRef<HTMLDivElement, CustomContentProps>(
  SnackbarComponent,
);
