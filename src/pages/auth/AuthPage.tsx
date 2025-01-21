import AccountIcon from "@mui/icons-material/Person";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { PageContent } from "components/Layout";

import { useIsLocalEnvironment } from "hooks/useIsLocalEnvironment";

import { useAuthStore } from "stores/auth.store";

export default function AuthPage() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [otpSendLoading, setOtpSendLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);

  const sendOtp = useAuthStore((state) => state.sendOTPCodeToEmail);
  const verifyOtp = useAuthStore((state) => state.verifyOTPCode);

  const isLocalEnvironment = useIsLocalEnvironment();

  const handleOTPSend = useCallback(() => {
    if (!email) {
      setErrorMessage(t("auth.email-required-error", "Email is required"));
      return;
    }
    if (email.split("@").length < 2) {
      setErrorMessage(
        t("auth.email-invalid-error", "Please enter a valid email"),
      );
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
  }, [email, sendOtp, t]);

  const handleVerifyOTP = useCallback(() => {
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
  }, [email, otp, t, verifyOtp]);

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
              <Stack spacing={2}>
                <Typography variant={"h6"}>
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
                  value={email}
                  onChange={(evt) => setEmail(evt.currentTarget.value)}
                />
                <Box display={"flex"} justifyContent={"flex-end"}>
                  <Button
                    variant={"contained"}
                    onClick={handleOTPSend}
                    disabled={otpSendLoading}
                  >
                    {t("auth.send-otp", "Send One Time Password")}
                  </Button>
                </Box>
              </Stack>
            </>
          ) : (
            <>
              {isLocalEnvironment && (
                <Alert severity="warning">
                  <Typography>
                    In a local environment, emails are sent to fake inboxes. You
                    can check the inbox for {email} to get the OTP{" "}
                    <a
                      target="_blank"
                      href={`http://localhost:54324/m/${email}`}
                    >
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
                onChange={(evt) => setOtp(evt.currentTarget.value)}
              />
              <Box display={"flex"} justifyContent={"flex-end"}>
                <Button
                  variant={"contained"}
                  onClick={handleVerifyOTP}
                  disabled={verifyOtpLoading}
                >
                  {t("auth.complete-otp-signin", "Sign In")}
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </PageContent>
    </>
  );
}
