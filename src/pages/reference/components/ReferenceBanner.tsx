import { useId } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { Button } from "ui/components/Button";
import { GradientBox } from "ui/components/GradientBox";
import { IconButton } from "ui/components/IconButton";
import { Text } from "ui/components/Text";
import { XIcon } from "ui/icons";
import { Logo } from "ui/layout";
import { Box, Grid } from "ui/primitives";

import { pathConfig } from "pages/pathConfig";

import { LoggerCategory, LoggerVerb, useLogEvent } from "hooks/useLogEvent";

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
  const logEvent = useLogEvent();

  const authStatus = useAuthStatus();
  const dismissed = useReferenceBanner((state) => state.dismissed);
  const dismiss = useReferenceBanner((state) => state.dismiss);

  if (authStatus !== AuthStatus.Unauthenticated || dismissed) return null;

  return (
    <GradientBox
      as="section"
      aria-labelledby={titleId}
      css={{
        position: "fixed",
        bottom: "4",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(600px, calc(100% - token(spacing.8)))",
        zIndex: "sticky",
        boxShadow: "lg",
      }}
    >
      {/* On a phone the button gets its own row under the text. */}
      <Grid
        gridTemplateColumns={{
          base: "minmax(0, 1fr) auto",
          sm: "auto minmax(0, 1fr) auto auto",
        }}
        gridTemplateAreas={{
          base: '"text close" "cta cta"',
          sm: '"logo text cta close"',
        }}
        alignItems="center"
        columnGap="3"
        rowGap="2"
        paddingInlineStart="3"
        paddingInlineEnd="1"
        paddingBlock="2"
      >
        <Box gridArea="logo" display={{ base: "none", sm: "flex" }}>
          <Logo size={32} />
        </Box>
        <Box gridArea="text" minWidth="0">
          <Text id={titleId} as="h2" weight="semibold">
            {t("reference.banner.title", "Ready to play?")}
          </Text>
          <Text variant="bodySm" color="muted">
            {t(
              "reference.banner.description",
              "Keep your character, rolls and notes in one place, solo or with friends.",
            )}
          </Text>
        </Box>
        <Box gridArea="cta" marginInlineEnd={{ base: "2", sm: "0" }}>
          <Button
            variant="primary"
            size="sm"
            nativeButton={false}
            render={<LinkComponent href={referenceBannerCreateCharacterHref} />}
            onClick={() =>
              logEvent(
                LoggerCategory.App,
                "reference_banner_start_playing",
                LoggerVerb.Click,
              )
            }
            css={{ width: { base: "100%", sm: "auto" } }}
          >
            {t("reference.banner.start-playing", "Start playing")}
          </Button>
        </Box>
        <Box gridArea="close" alignSelf={{ base: "start", sm: "center" }}>
          <IconButton
            size="sm"
            label={t("reference.banner.dismiss", "Dismiss")}
            onClick={() => {
              logEvent(
                LoggerCategory.App,
                "reference_banner_dismiss",
                LoggerVerb.Click,
              );
              dismiss();
              onDismiss();
            }}
          >
            <XIcon />
          </IconButton>
        </Box>
      </Grid>
    </GradientBox>
  );
}
