import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";

import { Button } from "ui/components/Button";
import { Text } from "ui/components/Text";
import { GithubLogoIcon } from "ui/icons";
import { Box, Grid, HStack } from "ui/primitives";

import { pathConfig } from "pages/pathConfig";

import { AuthStatus, useAuthStatus } from "stores/auth.store";

import { IStatRoll } from "services/gameLog.service";

import { HeroRollDemo } from "./HeroRollDemo";

const GITHUB_URL = "https://github.com/scottbenton/Iron-Link";

export interface HeroSectionProps {
  onRoll: (roll: IStatRoll) => void;
}

export function HeroSection(props: HeroSectionProps) {
  const { onRoll } = props;

  const { t } = useTranslation();
  const authStatus = useAuthStatus();
  const isAuthenticated = authStatus === AuthStatus.Authenticated;

  return (
    <Grid
      gridTemplateColumns="repeat(auto-fit, minmax(min(100%, 380px), 1fr))"
      gap="12"
      alignItems="center"
    >
      <Box>
        <Text variant="eyebrow">
          {t("home.hero.eyebrow", "Ironsworn & Starforged, together")}
        </Text>
        <Text variant="display" css={{ marginBlockStart: "2" }}>
          {t("home.hero.title", "Share every vow. Sync every roll.")}
        </Text>
        <Text color="muted" css={{ marginBlockStart: "4", maxWidth: "45ch" }}>
          {t(
            "home.hero.subtitle",
            "Play multiplayer games where every roll, vow, and clock is live for the whole table. Or play solo and have your game on all of your devices. Free, forever.",
          )}
        </Text>
        <HStack flexWrap="wrap" gap="3" marginBlockStart="6">
          <Button
            variant="gradient"
            nativeButton={false}
            render={
              <LinkComponent
                href={isAuthenticated ? pathConfig.gameSelect : pathConfig.auth}
              />
            }
          >
            {isAuthenticated
              ? t("home.hero.cta-authenticated", "Go to your games")
              : t("home.hero.cta-unauthenticated", "Start playing")}
          </Button>
          <Button
            variant="outline"
            startIcon={<GithubLogoIcon />}
            nativeButton={false}
            render={
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" />
            }
          >
            {t("home.hero.cta-github", "Open source")}
          </Button>
        </HStack>
      </Box>
      <HeroRollDemo onRoll={onRoll} />
    </Grid>
  );
}
