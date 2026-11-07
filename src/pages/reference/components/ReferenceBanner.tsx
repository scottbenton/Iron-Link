import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { GradientBox } from "components/GradientBox";
import { IronLinkLogo } from "components/Layout/IronLinkLogo";
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

// A bar floating at the bottom, in the app's gradient outline, that invites
// signed out visitors to keep a character in Iron Link. It reserves no room
// at the end of the page. Shown until it's dismissed on this device. A
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
    <GradientBox
      component="section"
      aria-labelledby={titleId}
      sx={(theme) => ({
        position: "fixed",
        bottom: theme.spacing(2),
        left: "50%",
        transform: "translateX(-50%)",
        width: `min(600px, calc(100% - ${theme.spacing(4)}))`,
        zIndex: theme.zIndex.snackbar - 1,
        p: 0.25,
        borderRadius: 2,
        boxShadow: theme.shadows[8],
      })}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          pl: 1.5,
          pr: 0.5,
          py: 1,
          borderRadius: 1.75,
          // A dark bar in both modes, so it stands apart from the page.
          bgcolor: "grey.900",
          color: "common.white",
          ...theme.applyStyles("dark", { bgcolor: "grey.800" }),
        })}
      >
        <Box aria-hidden display={{ xs: "none", sm: "flex" }} flexShrink={0}>
          <IronLinkLogo sx={{ width: 32, height: 32 }} />
        </Box>
        <Box flexGrow={1} minWidth={0}>
          <Typography
            id={titleId}
            variant="body1"
            component="h2"
            fontWeight={600}
          >
            {t("reference.banner.title", "Keep your character here too")}
          </Typography>
          <Typography
            variant="body2"
            color="grey.300"
            display={{ xs: "none", sm: "block" }}
          >
            {t(
              "reference.banner.description",
              "Track your stats, assets and progress, solo or with your group.",
            )}
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          LinkComponent={LinkComponent}
          href={referenceBannerCreateCharacterHref}
          sx={{ flexShrink: 0 }}
        >
          {t("reference.banner.create-character", "Create a character")}
        </Button>
        <IconButton
          size="small"
          color="inherit"
          aria-label={t("reference.banner.dismiss", "Dismiss")}
          onClick={() => {
            dismiss();
            onDismiss();
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </GradientBox>
  );
}
