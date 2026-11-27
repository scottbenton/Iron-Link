import { Outlet } from "react-router";

import { ErrorBoundary } from "components/ErrorBoundary";

import { AppNavBar } from "./AppNavBar";

export function DefaultLayout() {
  return (
    <>
      <AppNavBar />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </>
  );
}
