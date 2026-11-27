import { useCallback, useState } from "react";
import { Outlet } from "react-router";

import { ErrorBoundary } from "components/ErrorBoundary";
import { LinkComponent } from "components/LinkComponent";
import { RecentRolls } from "components/characters/rolls/RecentRolls";
import { RecentRollsInDialog } from "components/characters/rolls/RecentRollsInDialog";
import { DataswornDialog } from "components/datasworn/DataswornDialog";

import { LiveRegion } from "ui/components/Announcer";
import { Progress } from "ui/components/Progress";
import { AppShell, LinkComponentProvider, MAIN_CONTENT_ID } from "ui/layout";

import { AuthStatus, useAuthStatus } from "stores/auth.store";

import { AppNavRail } from "./AppNavRail";
import { LayoutPathListener } from "./LayoutPathListener";
import { DialogExtrasContext } from "./dialogExtrasContext";
import { ShellFillContext } from "./shellFillContext";
import { useFocusPageOnNavigate } from "./useFocusPageOnNavigate";

export function BaseLayout() {
  const authStatus = useAuthStatus();
  useFocusPageOnNavigate(MAIN_CONTENT_ID);

  // How many mounted pages want the shell to fill the screen.
  const [fillRequests, setFillRequests] = useState(0);
  const requestFill = useCallback(() => {
    setFillRequests((count) => count + 1);
    return () => setFillRequests((count) => count - 1);
  }, []);

  if (authStatus === AuthStatus.Loading) {
    return <Progress />;
  }

  return (
    <DialogExtrasContext.Provider value={RecentRollsInDialog}>
      <LinkComponentProvider linkComponent={LinkComponent}>
        <RecentRolls>
          <LiveRegion id={"live-region"} />
          <LayoutPathListener />
          <ShellFillContext.Provider value={requestFill}>
            <AppShell rail={<AppNavRail />} fill={fillRequests > 0}>
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </AppShell>
          </ShellFillContext.Provider>
          <DataswornDialog />
        </RecentRolls>
      </LinkComponentProvider>
    </DialogExtrasContext.Provider>
  );
}
