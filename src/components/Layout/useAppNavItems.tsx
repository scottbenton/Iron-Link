import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import {
  BookOpenIcon,
  GlobeHemisphereWestIcon,
  PencilSimpleIcon,
  UserPlusIcon,
  UsersIcon,
} from "ui/icons";
import { NavItem } from "ui/layout";

import { pathConfig } from "pages/pathConfig";

import { AuthStatus, useAuthStatus } from "stores/auth.store";

/**
 * The rail's and the phone menu's destinations for the reader's auth
 * status, with the one they are on marked current.
 *
 * They are deliberately not filtered by advanced feature toggles. A route
 * hidden from the nav is indistinguishable from one that does not exist, so
 * gating Worlds here would remove it entirely while Homebrew sat next to it
 * advertising itself as coming soon. Each page renders its own coming soon
 * state when its feature is off instead.
 */
export function useAppNavItems(): NavItem[] {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const signedIn = useAuthStatus() === AuthStatus.Authenticated;

  const reference = {
    id: "reference",
    label: t("reference.nav-title", "Reference"),
    href: pathConfig.reference,
    icon: <BookOpenIcon />,
    currentIcon: <BookOpenIcon weight="fill" />,
  };

  const items = signedIn
    ? [
        {
          id: "games",
          label: t("datasworn.games", "Games"),
          href: pathConfig.gameSelect,
          icon: <UsersIcon />,
          currentIcon: <UsersIcon weight="fill" />,
        },
        {
          id: "worlds",
          label: t("datasworn.worlds", "Worlds"),
          href: pathConfig.worldSelect,
          icon: <GlobeHemisphereWestIcon />,
          currentIcon: <GlobeHemisphereWestIcon weight="fill" />,
        },
        {
          id: "homebrew",
          label: t("datasworn.homebrew", "Homebrew"),
          href: pathConfig.homebrewSelect,
          icon: <PencilSimpleIcon />,
          currentIcon: <PencilSimpleIcon weight="fill" />,
        },
        reference,
      ]
    : [
        {
          id: "auth",
          label: t("datasworn.authenticate", "Sign In/Up"),
          href: pathConfig.auth,
          icon: <UserPlusIcon />,
          currentIcon: <UserPlusIcon weight="fill" />,
        },
        reference,
      ];

  return items.map((item) => ({
    ...item,
    current: pathname.startsWith(item.href),
  }));
}
