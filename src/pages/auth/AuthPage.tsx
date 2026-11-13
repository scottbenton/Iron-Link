import AccountIcon from "@mui/icons-material/Person";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FormEvent, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { PageContent } from "components/Layout";

import { pathConfig } from "pages/pathConfig";

import { useDocumentTitle } from "hooks/useDocumentTitle";
import { useIsLocalEnvironment } from "hooks/useIsLocalEnvironment";
import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useAuthStore } from "stores/auth.store";

import { SocialLoginOptions } from "./components/SocialLoginOptions";

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

  const handleOTPSend = useCallback(
    (evt?: FormEvent) => {
      evt?.preventDefault();
      if (otpSendLoading) return;
      if (!email) {
        setErrorMessage(t("auth.email-required-error", "Email is required"));
        return;
      }
      if (email.split("@").length < 2) {
        setErrorMessage(
          t("auth.email-invalid-error", "Please enter a valid email"),
        );
        return;
      }

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
      <PageContent maxWidth={"sm"}>
        <Stack spacing={4}>
          <Box>
            <Box pt={2} display={"flex"} alignItems={"center"}>
              <Box
                sx={(theme) => ({
                  display: "inline-flex",
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  p: 0.5,
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.common.white,
                })}
              >
                <AccountIcon />
              </Box>
              <Typography
                ml={1}
                variant={"h4"}
                component={"h1"}
                textTransform={"uppercase"}
                fontFamily={(theme) => theme.typography.fontFamilyTitle}
                color={"textSecondary"}
              >
                {t("auth.login-or-signup", "Login or Create an Account")}
              </Typography>
            </Box>
          </Box>
          {!otpSent ? (
            <>
              <SocialLoginOptions />
              <Stack
                spacing={2}
                component={"form"}
                noValidate
                onSubmit={handleOTPSend}
              >
                <Typography variant={"h6"} component={"h2"}>
                  {t("auth.passwordless-sign-in", "Sign in with Email")}
                </Typography>
                <Alert severity={"info"}>
                  {t(
                    "auth.sign-in-link-info",
                    "Get a one time password sent to your email.",
                  )}
                </Alert>
                {errorMessage && (
                  <Alert severity={"error"}>
                    <AlertTitle>
                      {t(
                        "auth.one-time-password-error",
                        "Error Sending One Time Password",
                      )}
                    </AlertTitle>
                    {errorMessage}
                  </Alert>
                )}
                <TextField
                  label={t("auth.email-label", "Email Address")}
                  type={"email"}
                  autoComplete={"email"}
                  value={email}
                  onChange={(evt) => setEmail(evt.currentTarget.value)}
                />
                <Box display={"flex"} justifyContent={"flex-end"}>
                  <Button
                    type={"submit"}
                    variant={"contained"}
                    disabled={otpSendLoading}
                  >
                    {t("auth.send-otp", "Send One Time Password")}
                  </Button>
                </Box>
              </Stack>
            </>
          ) : (
            <Stack
              spacing={4}
              component={"form"}
              noValidate
              onSubmit={handleVerifyOTP}
            >
              {isLocalEnvironment && (
                <Alert severity="warning">
                  <Typography>
                    In a local environment, emails are sent to fake inboxes. You
                    can check the inbox for {email} to get the OTP{" "}
                    <a target="_blank" href={`http://localhost:54324`}>
                      here
                    </a>
                    .
                  </Typography>
                </Alert>
              )}
              <Typography>
                {t(
                  "auth.otp-sent",
                  "A one time password has been sent to {{emailAddress}}. Please enter it here to complete your login.",
                  { emailAddress: email },
                )}
              </Typography>
              <TextField
                label={t("auth.otp-label", "One Time Password")}
                value={otp}
                placeholder="123456"
                autoFocus
                autoComplete={"one-time-code"}
                slotProps={{ htmlInput: { inputMode: "numeric" } }}
                onChange={(evt) => setOtp(evt.currentTarget.value)}
              />
              <Box display={"flex"} justifyContent={"flex-end"}>
                <Button
                  type={"submit"}
                  variant={"contained"}
                  disabled={verifyOtpLoading}
                >
                  {t("auth.complete-otp-signin", "Sign In")}
                </Button>
              </Box>
            </Stack>
          )}
          <Typography variant={"body2"} color={"textSecondary"}>
            <Link href={pathConfig.privacy}>
              {t("auth.privacy-policy-link", "Privacy Policy")}
            </Link>
          </Typography>
        </Stack>
      </PageContent>
    </>
  );
}
