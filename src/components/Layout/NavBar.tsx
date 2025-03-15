import { IronLinkLogo } from "@/assets/IronLinkLogo";
import { useLayoutTranslations } from "@/hooks/i18n/useLayoutTranslations";
import { pageConfig } from "@/pages/pageConfig";
import { LocalThemeProvider } from "@/providers/ThemeProvider/LocalThemeProvider";
import { Theme } from "@/stores/appState.store";
import { AuthStatus, useAuthStatus } from "@/stores/auth.store";
import { Box, Button, Container, Text } from "@chakra-ui/react";
import { ReactNode } from "react";
import { Link } from "wouter";

import { NavDrawer } from "./NavDrawer";
import { NavItems } from "./NavItems";
import { SettingsMenu } from "./SettingsMenu";

export interface NavBarProps {
  pageTitle?: string;
  backAction?: ReactNode;
}

export function NavBar(props: NavBarProps) {
  const { pageTitle, backAction } = props;

  const t = useLayoutTranslations();

  const authStatus = useAuthStatus();
  if (authStatus === AuthStatus.Loading) {
    return null;
  }

  return (
    <LocalThemeProvider theme={Theme.Dark}>
      <Container as="header" maxW="breakpoint-2xl" fluid>
        <Box borderColor="border" borderBottomWidth={1} py={2}>
          <Box
            display={{ base: backAction ? "flex" : "none", md: "none" }}
            alignItems="center"
          >
            {backAction}
            <Box flexGrow={1}>
              {pageTitle && (
                <Text fontSize="lg" fontWeight={"bold"} truncate>
                  {pageTitle}
                </Text>
              )}
            </Box>
            {authStatus === AuthStatus.Authenticated ? (
              <SettingsMenu colorPalette="gray" />
            ) : (
              <Box display="flex" gap={1}>
                <Button variant="subtle" colorPalette="gray" asChild>
                  <Link href={"~" + pageConfig.auth}>
                    {t("unauthenticated-button.login", "Login")}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={"~" + pageConfig.auth}>
                    {t("unauthenticated-button.get-started", "Get Started")}
                  </Link>
                </Button>
              </Box>
            )}
          </Box>
          <Box
            display={{ base: backAction ? "none" : "flex", md: "flex" }}
            alignItems="center"
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
        </Box>
      </Container>
    </LocalThemeProvider>
  );
}
