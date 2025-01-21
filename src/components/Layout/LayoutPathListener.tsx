import { useEffect } from "react";
import {
  createSearchParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";

import { pathConfig } from "pages/pathConfig";

import { AuthStatus, useAuthStatus, useUID } from "stores/auth.store";
import { useUserNameWithStatus } from "stores/users.store";

import { UserNameDialog } from "./UserNameDialog";

const openPaths = ["/", "/auth"];
const onlyUnauthenticatedPaths = ["/auth"];

export function LayoutPathListener() {
  const { pathname } = useLocation();
  const authStatus = useAuthStatus();
  const navigate = useNavigate();

  const uid = useUID();
  const { name, loading } = useUserNameWithStatus(uid ?? null);

  const [searchParams] = useSearchParams();
  const continuePath = searchParams.get("continuePath");

  useEffect(() => {
    if (
      authStatus === AuthStatus.Unauthenticated &&
      !openPaths.includes(pathname)
    ) {
      navigate({
        pathname: pathConfig.auth,
        search: createSearchParams({ continuePath: pathname }).toString(),
      });
    } else if (
      authStatus === AuthStatus.Authenticated &&
      onlyUnauthenticatedPaths.includes(pathname)
    ) {
      navigate(continuePath ?? pathConfig.gameSelect);
    }
  }, [authStatus, pathname, navigate, continuePath]);

  if (
    authStatus === AuthStatus.Unauthenticated &&
    !openPaths.includes(pathname)
  ) {
    return null;
  }
  if (
    authStatus === AuthStatus.Authenticated &&
    onlyUnauthenticatedPaths.includes(pathname)
  ) {
    return null;
  }

  return (
    <>
      <UserNameDialog open={!loading && name === null} />
    </>
  );
}
