import HamburgerMenuIcon from "@mui/icons-material/Menu";
import { AppBar, Box, Drawer, IconButton, List, Toolbar } from "@mui/material";
import { useState } from "react";

import { AppSettingsMenu } from "./AppSettingsMenu";
import { IronLinkLogo } from "./IronLinkLogo";
import { NavBarListItem } from "./NavBarListItem";
import { NavRouteConfig } from "./navRoutes";

export interface NavBarProps {
  routes: NavRouteConfig[];
}
export function NavBar(props: NavBarProps) {
  const { routes } = props;

  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  return (
    <>
      <AppBar
        elevation={0}
        position={"static"}
        color={"default"}
        sx={(theme) => ({
          bgcolor: "grey.800",
          color: "common.white",
          display: "block",
          [theme.breakpoints.up("sm")]: {
            display: "none",
          },
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
            <IconButton
              color={"inherit"}
              onClick={() => setIsNavMenuOpen(true)}
            >
              <HamburgerMenuIcon />
            </IconButton>
            <IronLinkLogo sx={{ width: 40, height: 40, ml: 2 }} />
          </Box>
          <AppSettingsMenu />
        </Toolbar>
      </AppBar>
      <Drawer open={isNavMenuOpen} onClose={() => setIsNavMenuOpen(false)}>
        <List>
          {routes.map((route, index) => (
            <NavBarListItem key={index} {...route} />
          ))}
        </List>
      </Drawer>
    </>
  );
}
