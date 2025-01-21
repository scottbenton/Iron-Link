import HomebrewIcon from "@mui/icons-material/Edit";
import GamesIcon from "@mui/icons-material/Group";
import CharacterIcon from "@mui/icons-material/Person";
import AuthIcon from "@mui/icons-material/PersonAddAlt1";
import WorldsIcon from "@mui/icons-material/TravelExplore";

import { pathConfig } from "pages/pathConfig";

import { i18n } from "i18n/config";

export interface NavRouteConfig {
  Logo: typeof CharacterIcon;
  title: string;
  href: string;
  checkIsSelected: (path: string) => boolean;
}

export const authenticatedNavRoutes: NavRouteConfig[] = [
  {
    Logo: GamesIcon,
    title: i18n.t("datasworn.games", "Games"),
    href: pathConfig.gameSelect,
    checkIsSelected: (path) => path.startsWith(pathConfig.gameSelect),
  },
  {
    Logo: WorldsIcon,
    title: i18n.t("datasworn.worlds", "Worlds"),
    href: pathConfig.worldSelect,
    checkIsSelected: (path) => path.startsWith(pathConfig.worldSelect),
  },
  {
    Logo: HomebrewIcon,
    title: i18n.t("datasworn.homebrew", "Homebrew"),
    href: pathConfig.homebrewSelect,
    checkIsSelected: (path) => path.startsWith(pathConfig.homebrewSelect),
  },
];
export const unauthenticatedNavRoutes: NavRouteConfig[] = [
  {
    Logo: AuthIcon,
    title: i18n.t("datasworn.authenticate", "Sign In/Up"),
    href: pathConfig.auth,
    checkIsSelected: (path) => path.startsWith(pathConfig.auth),
  },
];
