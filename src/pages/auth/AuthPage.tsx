import { FormEvent, useCallback, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { Alert } from "ui/components/Alert";
import { Button } from "ui/components/Button";
import { Form, FormActions } from "ui/components/Form";
import { Link } from "ui/components/Link";
import { Text } from "ui/components/Text";
import { TextField } from "ui/components/TextField";
import { PageContent, PageHeader } from "ui/layout";
import { Stack } from "ui/primitives";

import { pathConfig } from "pages/pathConfig";

import { useDocumentTitle } from "hooks/useDocumentTitle";
import { useIsLocalEnvironment } from "hooks/useIsLocalEnvironment";
import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useAuthStore } from "stores/auth.store";

import { SocialLoginOptions } from "./components/SocialLoginOptions";

// The local Supabase stack's mail catcher.
const LOCAL_INBOX_URL = "http://localhost:54324";

export default function AuthPage() {
  const { t } = useTranslation();
  useDocumentTitle(t("auth.login-or-signup", "Login or Create an Account"));
  useSendPageViewEvent(PageCategory.Auth);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [otpSendLoading, setOtpSendLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);

  const sendOtp = useAuthStore((state) => state.sendOTPCodeToEmail);
  const verifyOtp = useAuthStore((state) => state.verifyOTPCode);

  const isLocalEnvironment = useIsLocalEnvironment();

  const validateEmail = useCallback(
    (value: unknown) => {
      if (!value) {
        return t("auth.email-required-error", "Email is required");
      }
      if (String(value).split("@").length < 2) {
        return t("auth.email-invalid-error", "Please enter a valid email");
      }
      return null;
    },
    [t],
  );

  const handleOTPSend = useCallback(
    (evt?: FormEvent) => {
      evt?.preventDefault();
      // The form calls this only once validateEmail passes.
      if (otpSendLoading) return;

      setOtpSendLoading(true);
      sendOtp(email)
        .then(() => {
          setOtpSent(true);
          setErrorMessage("");
        })
        .catch((e) => {
          setErrorMessage(
            t("auth.error-sending", "Error sending OTP: {{message}}", {
              message: e.message,
            }),
          );
        })
        .finally(() => {
          setOtpSendLoading(false);
        });
    },
    [email, otpSendLoading, sendOtp, t],
  );

  const handleVerifyOTP = useCallback(
    (evt?: FormEvent) => {
      evt?.preventDefault();
      if (verifyOtpLoading) return;
      if (!otp) {
        setErrorMessage(t("auth.otp-required-error", "OTP is required"));
        return;
      }
      setVerifyOtpLoading(true);
      verifyOtp(email, otp)
        .then(() => {
          setErrorMessage("");
        })
        .catch((e) => {
          setErrorMessage(
            t("auth.error-verifying", "Error verifying OTP: {{message}}", {
              message: e.message,
            }),
          );
        })
        .finally(() => {
          setVerifyOtpLoading(false);
        });
    },
    [email, otp, t, verifyOtp, verifyOtpLoading],
  );

  return (
    <>
      <PageHeader
        maxWidth="xs"
        title={t("auth.login-or-signup", "Login or Create an Account")}
      />
      <PageContent maxWidth="xs">
        <Stack gap="8">
          {!otpSent ? (
            <>
              <SocialLoginOptions />
              <Form gap="4" onSubmit={handleOTPSend}>
                <Text variant="h3" as="h2">
                  {t("auth.passwordless-sign-in", "Sign in with Email")}
                </Text>
                <Alert tone="info">
                  {t(
                    "auth.sign-in-link-info",
                    "Get a one time password sent to your email.",
                  )}
                </Alert>
                {errorMessage && (
                  <Alert
                    tone="danger"
                    role="alert"
                    title={t(
                      "auth.one-time-password-error",
                      "Error Sending One Time Password",
                    )}
                  >
                    {errorMessage}
                  </Alert>
                )}
                <TextField
                  label={t("auth.email-label", "Email Address")}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onValueChange={setEmail}
                  validate={validateEmail}
                />
                <FormActions>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={otpSendLoading}
                  >
                    {t("auth.send-otp", "Send One Time Password")}
                  </Button>
                </FormActions>
              </Form>
            </>
          ) : (
            <Form gap="6" onSubmit={handleVerifyOTP}>
              {isLocalEnvironment && (
                <Alert tone="warning">
                  <Trans
                    i18nKey="auth.local-inbox-note"
                    defaults="In a local environment, emails are sent to fake inboxes. You can check the inbox for {{emailAddress}} to get the OTP <inboxLink>here</inboxLink>."
                    values={{ emailAddress: email }}
                    components={{
                      inboxLink: <Link href={LOCAL_INBOX_URL} external />,
                    }}
                  />
                </Alert>
              )}
              <Text>
                {t(
                  "auth.otp-sent",
                  "A one time password has been sent to {{emailAddress}}. Please enter it here to complete your login.",
                  { emailAddress: email },
                )}
              </Text>
              <TextField
                label={t("auth.otp-label", "One Time Password")}
                value={otp}
                placeholder="123456"
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                onValueChange={setOtp}
              />
              <FormActions>
                <Button
                  type="submit"
                  variant="primary"
                  loading={verifyOtpLoading}
                >
                  {t("auth.complete-otp-signin", "Sign In")}
                </Button>
              </FormActions>
            </Form>
          )}
          <Text variant="bodySm" color="muted">
            <Link render={<LinkComponent href={pathConfig.privacy} />}>
              {t("auth.privacy-policy-link", "Privacy Policy")}
            </Link>
          </Text>
        </Stack>
      </PageContent>
    </>
  );
}
