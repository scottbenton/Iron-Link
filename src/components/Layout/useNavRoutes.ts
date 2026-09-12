import { AuthStatus, useAuthStatus } from "stores/auth.store";

import {
  NavRouteConfig,
  authenticatedNavRoutes,
  unauthenticatedNavRoutes,
} from "./navRoutes";

// The nav routes for the current auth status.
//
// Routes are deliberately not filtered by advanced feature toggles. A route
// hidden from the nav is indistinguishable from one that does not exist, so
// gating Worlds here would have removed it entirely while Homebrew sat next to
// it advertising itself as coming soon. Each page renders its own coming-soon
// state when its feature is off instead.
export function useNavRoutes(): NavRouteConfig[] {
  const authStatus = useAuthStatus();

  return authStatus === AuthStatus.Authenticated
    ? authenticatedNavRoutes
    : unauthenticatedNavRoutes;
}
