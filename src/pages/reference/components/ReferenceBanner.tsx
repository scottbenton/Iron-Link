import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, IconButton, Paper, Typography } from "@mui/material";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { pathConfig } from "pages/pathConfig";

import { AuthStatus, useAuthStatus } from "stores/auth.store";

import { useReferenceBanner } from "../stores/referenceBanner.store";

export const referenceBannerCreateCharacterHref = `${pathConfig.auth}?continuePath=${pathConfig.gameCreate}`;

export interface ReferenceBannerProps {
  // Called after the banner is dismissed, so the page can move focus into it
  // instead of leaving it on a button that no longer exists.
  onDismiss: () => void;
}

// A slim bar floating at the bottom that invites signed out visitors to keep
// a character in Iron Link. Shown until it's dismissed on this device. A
// labelled region, not a live region, since it is there when the page loads
// and never changes.
export function ReferenceBanner(props: ReferenceBannerProps) {
  const { onDismiss } = props;
  const { t } = useTranslation();
  const titleId = useId();

  const authStatus = useAuthStatus();
  const dismissed = useReferenceBanner((state) => state.dismissed);
  const dismiss = useReferenceBanner((state) => state.dismiss);

  if (authStatus !== AuthStatus.Unauthenticated || dismissed) return null;

  return (
    <>
      {/* Room at the end of the page, so the bar never covers the last lines. */}
      <Box height={72} flexShrink={0} />
      <Paper
        component="section"
        aria-labelledby={titleId}
        elevation={6}
        sx={(theme) => ({
          position: "fixed",
          bottom: theme.spacing(2),
          left: "50%",
          transform: "translateX(-50%)",
          width: `min(560px, calc(100% - ${theme.spacing(4)}))`,
          zIndex: theme.zIndex.snackbar - 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: 2,
          pr: 0.5,
          py: 0.5,
        })}
      >
        <Typography id={titleId} variant="body2" component="h2" flexGrow={1}>
          {t("reference.banner.title", "Keep your character here too")}
        </Typography>
        <Button
          size="small"
          LinkComponent={LinkComponent}
          href={referenceBannerCreateCharacterHref}
        >
          {t("reference.banner.create-character", "Create a character")}
        </Button>
        <IconButton
          size="small"
          aria-label={t("reference.banner.dismiss", "Dismiss")}
          onClick={() => {
            dismiss();
            onDismiss();
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </>
  );
}
