import { useState } from "react";
import { Link } from "react-router-dom";
import AccountIcon from "@mui/icons-material/Person";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FirebaseError } from "firebase/app";

import { GoogleIcon } from "assets/GoogleIcon";
import { PageContent, PageHeader } from "components/Layout";
import { loginWithGoogle, sendMagicEmailLink } from "lib/auth.lib";
import { getErrorMessage } from "lib/getErrorMessage";
import { pathConfig } from "pages/pathConfig";
import { useSnackbar } from "providers/SnackbarProvider/useSnackbar";

export interface AuthPageProps {
  isLoginPage: boolean;
}

export function AuthPage(props: AuthPageProps) {
  const { isLoginPage } = props;
  const { error } = useSnackbar();

  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");

  const [linkSent, setLinkSent] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [linkSendLoading, setLinkSendLoading] = useState<boolean>(false);

  const handleMagicLinkSignup = () => {
    if (!email) {
      setErrorMessage("Email is required");
      return;
    }

    if (email.split("@").length < 2) {
      setErrorMessage("Please enter a valid email");
    }

    if (!isLoginPage && !name.trim()) {
      setErrorMessage("Name is required");
    }

    setLinkSendLoading(true);
    sendMagicEmailLink(email, !isLoginPage ? name : undefined)
      .then(() => {
        setLinkSent(true);
        setErrorMessage(undefined);
      })
      .catch((e: FirebaseError) => {
        setErrorMessage("Error sending email link: " + e.message);
      })
      .finally(() => {
        setLinkSendLoading(false);
      });
  };

  return (
    <>
      <PageHeader />
      <PageContent isPaper maxWidth={"sm"}>
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
                {isLoginPage ? "Log in" : "Create an Account"}
              </Typography>
            </Box>
            {isLoginPage ? (
              <Typography>
                Need an account?{" "}
                <Typography
                  component={Link}
                  color={"primary"}
                  to={pathConfig.signUp}
                >
                  Create an Account
                </Typography>
              </Typography>
            ) : (
              <Typography>
                Already have an account?{" "}
                <Typography
                  component={Link}
                  color={"primary"}
                  to={pathConfig.signIn}
                >
                  Login
                </Typography>
              </Typography>
            )}
          </Box>
          {!linkSent ? (
            <>
              <Button
                variant={"contained"}
                sx={(theme) => ({
                  backgroundColor: "#fff",
                  color: theme.palette.grey[900],
                  "&:hover": {
                    backgroundColor: theme.palette.grey[200],
                  },
                })}
                startIcon={<GoogleIcon />}
                onClick={() =>
                  loginWithGoogle().catch((e) =>
                    error(getErrorMessage(e, "Failed to log in")),
                  )
                }
              >
                {isLoginPage ? "Login with" : "Sign Up using"} Google
              </Button>
              <Divider>OR</Divider>
              <Stack spacing={2}>
                <Typography variant={"h6"}>Passwordless Sign in</Typography>
                <Alert severity={"info"}>
                  {!isLoginPage &&
                    "Get a sign in link emailed to you each time you log in. "}
                  You must open the link on the same device you clicked{" "}
                  {'"Send sign in link"'} on.
                </Alert>
                {errorMessage && (
                  <Alert severity={"error"}>
                    <AlertTitle>Error Sending Sign In Link</AlertTitle>
                    {errorMessage}
                  </Alert>
                )}
                <TextField
                  label={"Email Address"}
                  type={"email"}
                  value={email}
                  onChange={(evt) => setEmail(evt.currentTarget.value)}
                ></TextField>
                {!isLoginPage && (
                  <TextField
                    label={"Name"}
                    helperText={
                      "This will be visible to other players in a campaign."
                    }
                    value={name}
                    onChange={(evt) => setName(evt.currentTarget.value)}
                  />
                )}
                <Box display={"flex"} justifyContent={"flex-end"}>
                  <Button
                    variant={"contained"}
                    onClick={() => handleMagicLinkSignup()}
                    disabled={linkSendLoading}
                  >
                    Send Sign In Link
                  </Button>
                </Box>
              </Stack>
            </>
          ) : (
            <Alert severity="info">
              <AlertTitle>Sign in link sent</AlertTitle>
              Please check your email for the link to sign in. You must open the
              link in this browser to be logged in.
            </Alert>
          )}
        </Stack>
      </PageContent>
    </>
  );
}
