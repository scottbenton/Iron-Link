import { Outlet } from "react-router";

import { ErrorBoundary } from "components/ErrorBoundary";

import { AuthStatus, useAuthStatus } from "stores/auth.store";

import { NavBar } from "./NavBar";
import { authenticatedNavRoutes, unauthenticatedNavRoutes } from "./navRoutes";

export function DefaultLayout() {
  const authStatus = useAuthStatus();
  const navRoutes =
    authStatus === AuthStatus.Authenticated
      ? authenticatedNavRoutes
      : unauthenticatedNavRoutes;

  return (
    <>
      <NavBar topLevelRoutes={navRoutes} />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </>
  );
}
