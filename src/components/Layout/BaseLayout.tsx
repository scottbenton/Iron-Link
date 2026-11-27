import { Outlet, useMatch } from "react-router";

import { ErrorBoundary } from "components/ErrorBoundary";
import { LinkComponent } from "components/LinkComponent";
import { RollSnackbarSection } from "components/characters/rolls/RollSnackbarSection";
import { DataswornDialog } from "components/datasworn/DataswornDialog";

import { LiveRegion } from "ui/components/Announcer";
import { Progress } from "ui/components/Progress";
import { AppShell, LinkComponentProvider, MAIN_CONTENT_ID } from "ui/layout";

import { useIsMobile } from "hooks/useIsMobile";

import { AuthStatus, useAuthStatus } from "stores/auth.store";

import { AppNavRail } from "./AppNavRail";
import { LayoutPathListener } from "./LayoutPathListener";
import { DialogExtrasContext } from "./dialogExtrasContext";
import { useFocusPageOnNavigate } from "./useFocusPageOnNavigate";

/**
 * Until slice 9 moves the game page over, it keeps its own phone bar and
 * layout below the app's 900px breakpoint, so the rail (which the library
 * shows from 600px) stays off there.
 */
function useShowRail() {
  const gameMatch = useMatch("/games/:gameId/*");
  const isOnGamePage = !!gameMatch && gameMatch.params.gameId !== "create";
  const isAppMobile = useIsMobile();
  return !(isOnGamePage && isAppMobile);
}

export function BaseLayout() {
  const authStatus = useAuthStatus();
  const showRail = useShowRail();
  useFocusPageOnNavigate(MAIN_CONTENT_ID);

  if (authStatus === AuthStatus.Loading) {
    return <Progress />;
  }

  return (
    <DialogExtrasContext.Provider value={RollSnackbarSection}>
      <LinkComponentProvider linkComponent={LinkComponent}>
        <LiveRegion id={"live-region"} />
        <LayoutPathListener />
        <AppShell rail={showRail ? <AppNavRail /> : undefined}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </AppShell>
        <RollSnackbarSection isPage />
        <DataswornDialog />
      </LinkComponentProvider>
    </DialogExtrasContext.Provider>
  );
}
