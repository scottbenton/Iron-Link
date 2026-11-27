import { ColorModeToggle, NavRail } from "ui/layout";

import { pathConfig } from "pages/pathConfig";

import { AppSettingsMenu } from "../AppSettingsMenu";
import { useAppColorMode } from "../AppSettingsMenu/useAppColorMode";
import { useAppNavItems } from "../useAppNavItems";

/**
 * The rail on wide screens: the app's destinations, then the light and
 * dark toggle above the settings gear.
 */
export function AppNavRail() {
  const items = useAppNavItems();
  const { colorMode, setColorMode } = useAppColorMode();

  return (
    <NavRail
      items={items}
      homeHref={pathConfig.gameSelect}
      actions={
        <>
          <ColorModeToggle
            colorMode={colorMode}
            onColorModeChange={setColorMode}
            tooltipSide="right"
          />
          <AppSettingsMenu
            hideColorMode
            side="inline-end"
            align="end"
            tooltipSide="right"
          />
        </>
      }
    />
  );
}
