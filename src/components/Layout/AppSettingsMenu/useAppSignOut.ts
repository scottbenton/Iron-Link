import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { useAuthStore } from "stores/auth.store";

/** Signs out and reloads, or says why it could not. */
export function useAppSignOut() {
  const { t } = useTranslation();
  const { error } = useSnackbar();
  const signOut = useAuthStore((state) => state.signOut);

  return () => {
    signOut()
      .then(() => window.location.reload())
      .catch((e: Error) => {
        error(
          t("iron-link.error-signing-out", "Error signing out: {{message}}", {
            message: e.message,
          }),
        );
      });
  };
}
