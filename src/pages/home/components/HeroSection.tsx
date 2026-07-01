import GitHubIcon from "@mui/icons-material/GitHub";
import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { GradientButton } from "components/GradientButton";

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
    <Box
      display="grid"
      gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
      gap={6}
      alignItems="center"
    >
      <Box>
        <Typography
          variant="overline"
          component="p"
          color="primary"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
          letterSpacing={2}
        >
          {t("home.hero.eyebrow", "Ironsworn & Starforged, together")}
        </Typography>
        <Typography
          variant="h2"
          component="h1"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
          fontWeight={600}
          lineHeight={1.05}
          mt={1}
        >
          {t("home.hero.title", "The table is wherever you are.")}
        </Typography>
        <Typography color="text.secondary" mt={2} maxWidth="45ch">
          {t(
            "home.hero.subtitle",
            "Shared campaigns where every roll, vow, and clock is live for the whole table — plus the cleanest solo sheet in the Ironlands. Free, forever.",
          )}
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2} mt={3}>
          <GradientButton
            href={isAuthenticated ? pathConfig.gameSelect : pathConfig.auth}
          >
            {isAuthenticated
              ? t("home.hero.cta-authenticated", "Go to your games")
              : t("home.hero.cta-unauthenticated", "Start playing — free")}
          </GradientButton>
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<GitHubIcon />}
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("home.hero.cta-github", "Open source")}
          </Button>
        </Box>
      </Box>
      <HeroRollDemo onRoll={onRoll} />
    </Box>
  );
}
