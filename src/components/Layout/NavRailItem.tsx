import { Box, Typography } from "@mui/material";
import { useLocation } from "react-router";

import { GradientBox } from "components/GradientBox";
import { LinkComponent } from "components/LinkComponent";

import { NavRouteConfig } from "./navRoutes";

export function NavRailItem(props: NavRouteConfig) {
  const { Logo, title, checkIsSelected, href } = props;

  const { pathname } = useLocation();

  const isSelected = checkIsSelected(pathname);

  return (
    <Box
      component={LinkComponent}
      href={href}
      display={"flex"}
      flexDirection={"column"}
      alignItems={"center"}
      sx={[
        {
          color: "common.white",
          textDecoration: "none",
          "&:hover .pill": {
            bgcolor: "grey.800",
          },
        },
        {
          "& .pill": {
            bgcolor: isSelected ? "grey.800" : "grey.900",
            px: isSelected ? 2.25 : 2.5,
            py: isSelected ? 0.5 : 0.75,
            border: "1px solid",
            borderColor: isSelected ? "transparent" : "grey.900",
          },
          "& .pill-gradient": {
            padding: isSelected ? 0.25 : 0,
            background: isSelected ? undefined : "none",
          },
        },
      ]}
    >
      <GradientBox
        className="pill-gradient"
        sx={{
          overflow: "hidden",
          borderRadius: 999,
        }}
        hide={!isSelected}
      >
        <Box className="pill" display={"flex"} borderRadius={999}>
          <Logo />
        </Box>
      </GradientBox>
      <Typography
        variant="caption"
        sx={{
          color: isSelected ? "common.white" : "grey.300",
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}
