import BackIcon from "@mui/icons-material/ChevronLeft";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { HideOnScroll } from "components/HideOnScroll";
import { LinkComponent } from "components/LinkComponent";
import { ScreenReaderOnly } from "components/ScreenReaderOnly";

import { useIsMobile } from "hooks/useIsMobile";

import { IronLinkLogo } from "../IronLinkLogo";
import {
  LegacyAppSettingsMenu,
  MenuAdditionComponent,
} from "./LegacyAppSettingsMenu";

/**
 * The game page's phone bar until slice 9 moves the game page to the
 * library's NavBar. Every other page uses `AppNavBar`.
 */
export interface LegacyNavBarProps {
  goBackTo?: string;
  pageTitle?: string;
  secondLevel?: ReactNode;
  menuAdditions?: {
    menuItems?: MenuAdditionComponent[];
    menuDialogs?: MenuAdditionComponent[];
  };
}

export function LegacyNavBar(props: LegacyNavBarProps) {
  const { goBackTo, pageTitle, secondLevel, menuAdditions } = props;

  const { t } = useTranslation();

  const isMobile = useIsMobile();

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
            <LegacyAppSettingsMenu
              menuItems={menuAdditions?.menuItems}
              menuDialogs={menuAdditions?.menuDialogs}
            />
          </Toolbar>
          {secondLevel && <Toolbar>{secondLevel}</Toolbar>}
        </AppBar>
      </HideOnScroll>
      {/* These are here for spacing purposes */}
      <Toolbar />
      {secondLevel && <Toolbar />}
    </>
  );
}
