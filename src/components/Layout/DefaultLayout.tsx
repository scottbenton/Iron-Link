import { Outlet } from "react-router";

import { ErrorBoundary } from "components/ErrorBoundary";

import { NavBar } from "./NavBar";
import { useNavRoutes } from "./useNavRoutes";

export function DefaultLayout() {
  const navRoutes = useNavRoutes();

  return (
    <>
      <NavBar topLevelRoutes={navRoutes} />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </>
  );
}
