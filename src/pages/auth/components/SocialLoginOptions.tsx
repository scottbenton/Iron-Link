import { Alert, AlertTitle, Button, Divider, Stack } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { DiscordIcon } from "assets/DiscordIcon";
import { GoogleIcon } from "assets/GoogleIcon";

import { useAuthStore } from "stores/auth.store";

import { OAuthProvider } from "services/auth.service";

import { useOAuthRedirectError } from "../hooks/useOAuthRedirectError";

export function SocialLoginOptions() {
  const { t } = useTranslation();

  const signInWithOAuth = useAuthStore((store) => store.signInWithOAuth);
  const redirectError = useOAuthRedirectError();

  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider>();
  const [startErrorMessage, setStartErrorMessage] = useState<string>();

  // If the user comes back from the provider with the browser's back button,
  // the page may be restored from the back/forward cache with the buttons
  // still disabled. Re-enable them in that case.
  useEffect(() => {
    const handlePageShow = (evt: PageTransitionEvent) => {
      if (evt.persisted) {
        setLoadingProvider(undefined);
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleSignIn = useCallback(
    (provider: OAuthProvider) => {
      setLoadingProvider(provider);
      setStartErrorMessage(undefined);
      // On success the browser navigates to the provider, so the buttons stay
      // disabled until the page unloads.
      signInWithOAuth(provider).catch((e) => {
        setLoadingProvider(undefined);
        setStartErrorMessage(
          t("auth.oauth-start-error", "Could not start sign in: {{message}}", {
            message: e.message,
          }),
        );
      });
    },
    [signInWithOAuth, t],
  );

  let errorMessage = startErrorMessage;
  if (!errorMessage && redirectError) {
    if (redirectError.error === "access_denied") {
      errorMessage = t("auth.oauth-cancelled", "Sign in was cancelled.");
    } else {
      const details =
        redirectError.description ?? redirectError.code ?? redirectError.error;
      errorMessage = details
        ? t("auth.oauth-redirect-error", "Sign in failed: {{message}}", {
            message: details,
          })
        : t(
            "auth.oauth-unknown-error",
            "Something went wrong while signing in. Please try again.",
          );
    }
  }

  return (
    <Stack spacing={2}>
      {errorMessage && (
        <Alert severity={"error"}>
          <AlertTitle>
            {t("auth.oauth-error-title", "Could Not Sign In")}
          </AlertTitle>
          {errorMessage}
        </Alert>
      )}
      <Button
        variant={"outlined"}
        color={"inherit"}
        size={"large"}
        startIcon={<GoogleIcon />}
        onClick={() => handleSignIn("google")}
        disabled={!!loadingProvider}
      >
        {t("auth.continue-with-google", "Continue with Google")}
      </Button>
      <Button
        variant={"outlined"}
        color={"inherit"}
        size={"large"}
        startIcon={<DiscordIcon />}
        onClick={() => handleSignIn("discord")}
        disabled={!!loadingProvider}
      >
        {t("auth.continue-with-discord", "Continue with Discord")}
      </Button>
      <Divider>{t("auth.or", "or")}</Divider>
    </Stack>
  );
}
