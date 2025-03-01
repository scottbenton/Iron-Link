import { IronLinkLogo } from "@/assets/IronLinkLogo";
import { useLayoutTranslations } from "@/hooks/i18n/useLayoutTranslations";
import { pageConfig } from "@/pages/pageConfig";
import { LocalThemeProvider } from "@/providers/ThemeProvider/LocalThemeProvider";
import { Theme } from "@/stores/appState.store";
import { AuthStatus, useAuthStatus } from "@/stores/auth.store";
import { Box, Button, Container } from "@chakra-ui/react";
import { Link } from "wouter";

import { NavDrawer } from "./NavDrawer";
import { NavItems } from "./NavItems";
import { SettingsMenu } from "./SettingsMenu";

export function NavBar() {
  const t = useLayoutTranslations();

  const authStatus = useAuthStatus();
  if (authStatus === AuthStatus.Loading) {
    return null;
  }

  return (
    <LocalThemeProvider theme={Theme.Dark}>
      <Container as="header" maxW="breakpoint-2xl" fluid>
        <Box
          display="flex"
          alignItems="center"
          borderColor="border"
          borderBottomWidth={1}
          py={2}
        >
          {authStatus === AuthStatus.Authenticated && (
            <Box display={{ base: "flex", sm: "none" }}>
              <NavDrawer />
            </Box>
          )}
          <IronLinkLogo />
          <Box flexGrow={1}>
            {authStatus === AuthStatus.Authenticated && (
              <NavItems ml={4} display={{ base: "none", sm: "flex" }} />
            )}
          </Box>
          {authStatus === AuthStatus.Authenticated ? (
            <SettingsMenu colorPalette="gray" />
          ) : (
            <Box display="flex" gap={1}>
              <Button variant="subtle" colorPalette="gray" asChild>
                <Link href={pageConfig.auth}>
                  {t("unauthenticated-button.login", "Login")}
                </Link>
              </Button>
              <Button asChild>
                <Link href={pageConfig.auth}>
                  {t("unauthenticated-button.get-started", "Get Started")}
                </Link>
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </LocalThemeProvider>
  );
}
