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
  // Called after the banner is dismissed, so the page can move focus to its
  // heading instead of leaving it on a button that no longer exists.
  onDismiss: () => void;
}

// Invites signed out visitors to keep a character in Iron Link. Shown until
// it's dismissed on this device. A labelled region, not a live region, since it
// is there when the page loads and never changes.
export function ReferenceBanner(props: ReferenceBannerProps) {
  const { onDismiss } = props;
  const { t } = useTranslation();
  const titleId = useId();

  const authStatus = useAuthStatus();
  const dismissed = useReferenceBanner((state) => state.dismissed);
  const dismiss = useReferenceBanner((state) => state.dismiss);

  if (authStatus !== AuthStatus.Unauthenticated || dismissed) return null;

  return (
    <Paper
      component="section"
      aria-labelledby={titleId}
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        display: "flex",
        gap: 2,
        alignItems: "flex-start",
      }}
    >
      <Box flexGrow={1}>
        <Typography id={titleId} variant="h6" component="h2">
          {t("reference.banner.title", "Keep your character here too")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t(
            "reference.banner.body",
            "Iron Link tracks stats, meters, assets and progress, and lets your group play together.",
          )}
        </Typography>
        <Button
          variant="contained"
          LinkComponent={LinkComponent}
          href={referenceBannerCreateCharacterHref}
          sx={{ mt: 1.5 }}
        >
          {t("reference.banner.create-character", "Create a character")}
        </Button>
      </Box>
      <IconButton
        aria-label={t("reference.banner.dismiss", "Dismiss")}
        onClick={() => {
          dismiss();
          onDismiss();
        }}
      >
        <CloseIcon />
      </IconButton>
    </Paper>
  );
}
