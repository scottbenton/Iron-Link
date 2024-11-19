import { Box, Stack } from "@mui/material";

import { AppSettingsMenu } from "./AppSettingsMenu";
import { IronLinkLogo } from "./IronLinkLogo";
import { NavRailItem } from "./NavRailItem";
import { NavRouteConfig } from "./navRoutes";

export interface NavRailProps {
  routes: NavRouteConfig[];
}

export function NavRail(props: NavRailProps) {
  const { routes } = props;

  return (
    <>
      <Box
        sx={{
          width: 80,
          flexShrink: 0,
        }}
      />
      <Box
        sx={(theme) => ({
          position: "fixed",

          top: 0,
          left: 0,
          bottom: 0,

          bgcolor: "grey.900",
          color: "common.white",
          width: 80,
          height: "100%",
          py: 2,
          display: "none",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          [theme.breakpoints.up("sm")]: {
            display: "inline-flex",
          },
        })}
      >
        <IronLinkLogo sx={{ width: 48, height: 48 }} />
        <Stack
          mt={4}
          mb={8}
          component={"nav"}
          flexGrow={1}
          display="flex"
          flexDirection={"column"}
          alignItems={"center"}
          spacing={1}
        >
          {routes.map((route, index) => (
            <NavRailItem key={index} {...route} />
          ))}
        </Stack>
        <AppSettingsMenu />
      </Box>
    </>
  );
}
