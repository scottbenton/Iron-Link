import {
  MenuContent,
  MenuItem,
  MenuItemGroup,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";
import { useLayoutTranslations } from "@/hooks/i18n/useLayoutTranslations";
import { Theme, useAppState } from "@/stores/appState.store";
import { useAuthStore } from "@/stores/auth.store";
import {
  Icon,
  IconButton,
  IconButtonProps,
  MenuItemGroupLabel,
} from "@chakra-ui/react";
import { BoltIcon, LogOutIcon, MoonIcon, SunIcon, ZapIcon } from "lucide-react";
import { ReactNode, useState } from "react";

import { AdvancedFeaturesDialog } from "./AdvancedFeaturesDialog";

export type SettingsMenuProps = IconButtonProps & {
  groups?: ReactNode;
  dialogs?: ReactNode;
};

export function SettingsMenu(props: SettingsMenuProps) {
  const { groups, dialogs, ...iconButtonProps } = props;

  const t = useLayoutTranslations();

  const theme = useAppState((state) => state.theme);
  const setTheme = useAppState((state) => state.setTheme);

  const logout = useAuthStore((state) => state.signOut);

  const [advancedFeaturesDialogOpen, setAdvancedFeaturesDialogOpen] =
    useState(false);

  return (
    <>
      <MenuRoot>
        <MenuTrigger asChild>
          <IconButton
            aria-label={t("settings", "Settings")}
            variant="ghost"
            {...iconButtonProps}
          >
            <BoltIcon />
          </IconButton>
        </MenuTrigger>
        <MenuContent>
          {groups}
          <MenuItemGroup>
            <MenuItemGroupLabel>
              {t("app-settings-menu-title", "App Settings")}
            </MenuItemGroupLabel>
            <MenuItem
              cursor="pointer"
              value="theme-toggle"
              onClick={() =>
                setTheme(theme === Theme.Light ? Theme.Dark : Theme.Light)
              }
            >
              <Icon size="sm" asChild color="fg.subtle">
                {theme === Theme.Dark ? <SunIcon /> : <MoonIcon />}
              </Icon>
              {theme === Theme.Dark
                ? t("light-theme", "Light Theme")
                : t("dark-theme", "Dark Theme")}
            </MenuItem>
            <MenuItem
              cursor="pointer"
              value="advanced-features"
              onClick={() => setAdvancedFeaturesDialogOpen(true)}
            >
              <Icon size="sm" asChild color="fg.subtle">
                <ZapIcon />
              </Icon>
              {t("advanced-features", "Advanced Features")}
            </MenuItem>
            <MenuItem
              cursor="pointer"
              value="logout"
              onClick={() =>
                logout().then(() => {
                  window.location.reload();
                })
              }
            >
              <Icon size="sm" asChild color="fg.subtle">
                <LogOutIcon />
              </Icon>
              {t("logout", "Logout")}
            </MenuItem>
          </MenuItemGroup>
        </MenuContent>
      </MenuRoot>
      <AdvancedFeaturesDialog
        open={advancedFeaturesDialogOpen}
        onClose={() => setAdvancedFeaturesDialogOpen(false)}
      />
      {dialogs}
    </>
  );
}
