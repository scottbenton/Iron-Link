import { useMemo } from "react";

import { useAdvancedFeatureToggle } from "hooks/advancedFeatures/advancedFeatures";

import { AuthStatus, useAuthStatus } from "stores/auth.store";

import {
  NavRouteConfig,
  authenticatedNavRoutes,
  unauthenticatedNavRoutes,
} from "./navRoutes";

// The nav routes for the current auth status, minus any route whose advanced
// feature toggle is off.
export function useNavRoutes(): NavRouteConfig[] {
  const authStatus = useAuthStatus();
  const worldsEnabled = useAdvancedFeatureToggle("worlds");

  const routes =
    authStatus === AuthStatus.Authenticated
      ? authenticatedNavRoutes
      : unauthenticatedNavRoutes;

  return useMemo(
    () =>
      routes.filter((route) => route.featureKey !== "worlds" || worldsEnabled),
    [routes, worldsEnabled],
  );
}
