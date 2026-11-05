import BackIcon from "@mui/icons-material/ChevronLeft";
import HamburgerMenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { HideOnScroll } from "components/HideOnScroll";
import { LinkComponent } from "components/LinkComponent";
import { ScreenReaderOnly } from "components/ScreenReaderOnly";

import { AppSettingsMenu, MenuAdditionComponent } from "./AppSettingsMenu";
import { IronLinkLogo } from "./IronLinkLogo";
import { NavBarListItem } from "./NavBarListItem";
import { NavRouteConfig } from "./navRoutes";

export interface NavBarProps {
  topLevelRoutes?: NavRouteConfig[] | undefined;
  goBackTo?: string;
  pageTitle?: string;
  secondLevel?: ReactNode;
  menuAdditions?: {
    menuItems?: MenuAdditionComponent[];
    menuDialogs?: MenuAdditionComponent[];
  };
}

export function NavBar(props: NavBarProps) {
  const { topLevelRoutes, goBackTo, pageTitle, secondLevel, menuAdditions } =
    props;

  const { t } = useTranslation();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (!isMobile) {
    // The bar is phone only, but its title is the page's heading, so wider
    // screens keep it for screen readers.
    return pageTitle ? (
      <ScreenReaderOnly>
        <h1>{pageTitle}</h1>
      </ScreenReaderOnly>
    ) : null;
  }

  return (
    <>
      <HideOnScroll>
        <AppBar
          elevation={0}
          color={"default"}
          sx={(theme) => ({
            bgcolor: theme.palette.mode === "light" ? "grey.200" : "grey.950",
            // bgcolor: "grey.950",
            // color: "common.white",
            display: "block",
          })}
        >
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box display={"flex"} alignItems={"center"}>
              {topLevelRoutes && (
                <Tooltip
                  title={t("nav.open-menu-mobile", "Open Navigation Menu")}
                >
                  <IconButton
                    color={"inherit"}
                    onClick={() => setIsNavMenuOpen(true)}
                  >
                    <HamburgerMenuIcon />
                  </IconButton>
                </Tooltip>
              )}
              {goBackTo && (
                <Tooltip title={t("nav.go-back-mobile", "Go Back")}>
                  <div>
                    <IconButton
                      LinkComponent={LinkComponent}
                      color={"inherit"}
                      href={goBackTo}
                      aria-label={t("nav.go-back-mobile", "Go Back")}
                    >
                      <BackIcon />
                    </IconButton>
                  </div>
                </Tooltip>
              )}
              {pageTitle ? (
                <Typography variant={"h6"} component={"h1"} ml={2}>
                  {pageTitle}
                </Typography>
              ) : (
                <IronLinkLogo sx={{ width: 40, height: 40, ml: 2 }} />
              )}
            </Box>
            <AppSettingsMenu
              menuItems={menuAdditions?.menuItems}
              menuDialogs={menuAdditions?.menuDialogs}
            />
          </Toolbar>
          {secondLevel && <Toolbar>{secondLevel}</Toolbar>}
        </AppBar>
      </HideOnScroll>
      <Drawer
        open={topLevelRoutes && isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
      >
        <Box component={"nav"} aria-label={t("nav.main-navigation", "Main")}>
          <List>
            {topLevelRoutes?.map((route, index) => (
              <NavBarListItem key={index} {...route} />
            ))}
          </List>
        </Box>
      </Drawer>

      {/* These are here for spacing purposes */}
      <Toolbar />
      {secondLevel && <Toolbar />}
    </>
  );
}
