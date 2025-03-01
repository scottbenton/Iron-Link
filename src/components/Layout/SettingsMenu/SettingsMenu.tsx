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
import { Icon, IconButton, IconButtonProps } from "@chakra-ui/react";
import { BoltIcon, LogOutIcon, MoonIcon, SunIcon } from "lucide-react";

export type SettingsMenuProps = IconButtonProps & {};

export function SettingsMenu(props: SettingsMenuProps) {
  const { ...iconButtonProps } = props;

  const t = useLayoutTranslations();

  const theme = useAppState((state) => state.theme);
  const setTheme = useAppState((state) => state.setTheme);

  const logout = useAuthStore((state) => state.signOut);

  return (
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
        <MenuItemGroup>
          <MenuItem
            cursor="pointer"
            value="theme-toggle"
            onClick={() =>
              setTheme(theme === Theme.Light ? Theme.Dark : Theme.Light)
            }
          >
            <Icon size="sm" asChild color="gray.500">
              {theme === Theme.Dark ? <SunIcon /> : <MoonIcon />}
            </Icon>
            {theme === Theme.Dark
              ? t("light-theme", "Light Theme")
              : t("dark-theme", "Dark Theme")}
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
            <Icon size="sm" asChild color="gray.500">
              <LogOutIcon />
            </Icon>
            {t("logout", "Logout")}
          </MenuItem>
        </MenuItemGroup>
      </MenuContent>
    </MenuRoot>
  );
}
