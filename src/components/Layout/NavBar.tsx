import BackIcon from "@mui/icons-material/ArrowBack";
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
} from "@mui/material";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { HideOnScroll } from "components/HideOnScroll";
import { LinkComponent } from "components/LinkComponent";
import { ScreenReaderOnly } from "components/ScreenReaderOnly";

import { useIsMobile } from "hooks/useIsMobile";

import { AppSettingsMenu, MenuAdditionComponent } from "./AppSettingsMenu";
import { IronLinkLogo } from "./IronLinkLogo";
import { NavBarListItem } from "./NavBarListItem";
import { NavRouteConfig } from "./navRoutes";

export interface NavBarProps {
  topLevelRoutes?: NavRouteConfig[] | undefined;
  goBackTo?: string;
  // The back button's name, when "Go Back" doesn't say where it goes.
  goBackLabel?: string;
  pageTitle?: string;
  // Shown in the h1 in place of the plain title on phones, such as a button
  // that switches between pages. Its text should still read as the title.
  pageTitleContent?: ReactNode;
  menuAdditions?: {
    menuItems?: MenuAdditionComponent[];
    menuDialogs?: MenuAdditionComponent[];
  };
}

export function NavBar(props: NavBarProps) {
  const {
    topLevelRoutes,
    goBackTo,
    goBackLabel,
    pageTitle,
    pageTitleContent,
    menuAdditions,
  } = props;

  const { t } = useTranslation();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  const isMobile = useIsMobile();
  const backLabel = goBackLabel ?? t("nav.go-back-mobile", "Go Back");

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
            <Box display={"flex"} alignItems={"center"} flex={1} minWidth={0}>
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
                <Tooltip title={backLabel}>
                  <div>
                    <IconButton
                      LinkComponent={LinkComponent}
                      color={"inherit"}
                      href={goBackTo}
                      aria-label={backLabel}
                    >
                      <BackIcon />
                    </IconButton>
                  </div>
                </Tooltip>
              )}
              {pageTitleContent ? (
                <Typography
                  variant={"h6"}
                  component={"h1"}
                  ml={1}
                  flex={1}
                  minWidth={0}
                  display={"flex"}
                >
                  {pageTitleContent}
                </Typography>
              ) : pageTitle ? (
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
    </>
  );
}
