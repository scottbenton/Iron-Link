import { Box, LinearProgress } from "@mui/material";
import { Outlet } from "react-router";

import { ErrorBoundary } from "components/ErrorBoundary";
import { RollSnackbarSection } from "components/characters/rolls/RollSnackbarSection";
import { DataswornDialog } from "components/datasworn/DataswornDialog";

import { AuthStatus, useAuthStatus } from "stores/auth.store";

import { LayoutPathListener } from "./LayoutPathListener";
import { LiveRegion } from "./LiveRegion";
import { NavRail } from "./NavRail";
import { SkipToContentButton } from "./SkipToContentButton";
import { useNavRoutes } from "./useNavRoutes";

export function BaseLayout() {
  const authStatus = useAuthStatus();
  const routes = useNavRoutes();

  if (authStatus === AuthStatus.Loading) {
    return <LinearProgress />;
  }

  return (
    <Box
      minHeight={"100vh"}
      display={"flex"}
      flexDirection={"column"}
      bgcolor="grey.950"
    >
      <Box
        display={"flex"}
        flexDirection={{ xs: "column", md: "row" }}
        flexGrow={1}
        position="relative"
      >
        <LiveRegion id={"live-region"} />
        <SkipToContentButton />
        <LayoutPathListener />
        <NavRail routes={routes} />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            minWidth: 0,
            "&:focus": { outline: "none" },
          }}
          component={"main"}
          id={"main-content"}
          // Lets Skip to Content move focus here, not just scroll, in Safari.
          tabIndex={-1}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Box>
      </Box>
      <RollSnackbarSection />
      <DataswornDialog />
    </Box>
  );
}
