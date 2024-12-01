import { Box, LinearProgress } from "@mui/material";
import { Outlet } from "react-router-dom";

import { RollSnackbarSection } from "components/characters/rolls/RollSnackbarSection";
import { DataswornDialog } from "components/datasworn/DataswornDialog";

import { AuthStatus, useAuthStatus } from "stores/auth.store";

import { LayoutPathListener } from "./LayoutPathListener";
import { LiveRegion } from "./LiveRegion";
import { NavBar } from "./NavBar";
import { NavRail } from "./NavRail";
import { SkipToContentButton } from "./SkipToContentButton";
import { authenticatedNavRoutes, unauthenticatedNavRoutes } from "./navRoutes";

export function Layout() {
  const authStatus = useAuthStatus();

  if (authStatus === AuthStatus.Loading) {
    return <LinearProgress />;
  }

  const routes =
    authStatus === AuthStatus.Authenticated
      ? authenticatedNavRoutes
      : unauthenticatedNavRoutes;

  return (
    <Box
      minHeight={"100vh"}
      display={"flex"}
      flexDirection={"column"}
      bgcolor="grey.950"
    >
      <Box
        display={"flex"}
        flexDirection={{ xs: "column", sm: "row" }}
        flexGrow={1}
        position="relative"
      >
        <LiveRegion />
        <SkipToContentButton />
        <LayoutPathListener />
        <NavBar routes={routes} />
        <NavRail routes={routes} />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
          }}
          component={"main"}
          id={"main-content"}
        >
          <Outlet />
        </Box>
      </Box>
      <RollSnackbarSection />
      <DataswornDialog />
      {/* <UserNameDialog
          open={userNameDialogOpen}
          handleClose={closeUserNameDialog}
        />
        <UpdateDialog />
        <LinkedDialog />
        <RollSnackbarSection /> */}
    </Box>
  );
}
