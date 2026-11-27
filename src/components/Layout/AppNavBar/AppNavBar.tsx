import { NavBar } from "ui/layout";

import { pathConfig } from "pages/pathConfig";

import { AppSettingsMenu } from "../AppSettingsMenu";
import { useAppNavItems } from "../useAppNavItems";

/**
 * The phone top bar on every page but the game page: a menu of the app's
 * destinations, the logo and the settings gear. Wide screens show the rail
 * instead, and the bar renders nothing there, since it has no title.
 */
export function AppNavBar() {
  const items = useAppNavItems();

  return (
    <NavBar
      items={items}
      homeHref={pathConfig.gameSelect}
      actions={<AppSettingsMenu />}
    />
  );
}
