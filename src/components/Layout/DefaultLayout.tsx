import { Outlet } from "react-router";

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
      <Outlet />
    </>
  );
}
