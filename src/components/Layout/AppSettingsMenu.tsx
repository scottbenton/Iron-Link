import AccessibilityIcon from "@mui/icons-material/AccessibilityNew";
import AdvancedFeaturesIcon from "@mui/icons-material/Bolt";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  IconButton,
  ListItemIcon,
  ListSubheader,
  Menu,
  MenuItem,
  Tooltip,
  useColorScheme,
} from "@mui/material";
import { ComponentType, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { AuthStatus, useAuthStatus, useAuthStore } from "stores/auth.store";

import { A11ySettingsDialog } from "./A11ySettingsDialog";
import { AdvancedFeaturesDialog } from "./AdvancedFeaturesDialog";

export type MenuAdditionComponent = ComponentType<{ closeMenu: () => void }>;

export interface AppSettingsMenuProps {
  menuItems?: MenuAdditionComponent[];
  menuDialogs?: MenuAdditionComponent[];
}

export function AppSettingsMenu(props: AppSettingsMenuProps) {
  const { menuItems, menuDialogs } = props;
  const { t } = useTranslation();
  const status = useAuthStatus();

  const [open, setOpen] = useState(false);
  const closeMenu = useCallback(() => setOpen(false), []);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { colorScheme, setColorScheme } = useColorScheme();

  const { error } = useSnackbar();
  const signOut = useAuthStore((state) => state.signOut);

  const [advancedFeaturesOpen, setAdvancedFeaturesOpen] = useState(false);
  const [accessibilitySettingsDialogOpen, setAccessibilitySettingsDialogOpen] =
    useState(false);

  return (
    <>
      <Tooltip title={t("iron-link.app-settings", "App Settings")}>
        <IconButton
          ref={buttonRef}
          color="inherit"
          aria-label={t("iron-link.app-settings", "App Settings")}
          onClick={() => setOpen(true)}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <Menu open={open} onClose={closeMenu} anchorEl={buttonRef.current}>
        {menuItems?.map((Item, index) => (
          <Item closeMenu={closeMenu} key={index} />
        ))}
        <ListSubheader>
          {t("iron-link.app-settings", "App Settings")}
        </ListSubheader>
        <MenuItem
          onClick={() => {
            setColorScheme(colorScheme === "light" ? "dark" : "light");
            setOpen(false);
          }}
        >
          <ListItemIcon>
            {colorScheme === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </ListItemIcon>
          {colorScheme === "light"
            ? t("iron-link.dark-mode", "Dark Mode")
            : t("iron-link.light-mode", "Light Mode")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAccessibilitySettingsDialogOpen(true);
            setOpen(false);
          }}
        >
          <ListItemIcon>
            <AccessibilityIcon />
          </ListItemIcon>
          {t("iron-link.accessibility-settings", "Accessibility Settings")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAdvancedFeaturesOpen(true);
            setOpen(false);
          }}
        >
          <ListItemIcon>
            <AdvancedFeaturesIcon />
          </ListItemIcon>
          {t("iron-link.advanced-features", "Advanced Features")}
        </MenuItem>
        {status === AuthStatus.Authenticated && (
          <MenuItem
            onClick={() => {
              setOpen(false);

              signOut()
                .then(() => window.location.reload())
                .catch((e) => {
                  error(
                    t(
                      "iron-link.error-signing-out",
                      "Error signing out: {{message}}",
                      {
                        message: e.message,
                      },
                    ),
                  );
                });
            }}
          >
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>

            {t("iron-link.sign-out", "Sign Out")}
          </MenuItem>
        )}
      </Menu>
      {menuDialogs?.map((Dialog, index) => (
        <Dialog closeMenu={closeMenu} key={index} />
      ))}
      <AdvancedFeaturesDialog
        open={advancedFeaturesOpen}
        onClose={() => setAdvancedFeaturesOpen(false)}
      />
      <A11ySettingsDialog
        open={accessibilitySettingsDialogOpen}
        onClose={() => setAccessibilitySettingsDialogOpen(false)}
      />
    </>
  );
}
