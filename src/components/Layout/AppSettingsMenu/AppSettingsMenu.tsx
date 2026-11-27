import { useState } from "react";
import { useTranslation } from "react-i18next";

import { SettingsMenu, SettingsMenuAction, SettingsMenuProps } from "ui/layout";

import { useAdminStore } from "stores/admin.store";
import { AuthStatus, useAuthStatus } from "stores/auth.store";

import { A11ySettingsDialog } from "../A11ySettingsDialog";
import { AdminDialog } from "../AdminDialog";
import { AdvancedFeaturesDialog } from "../AdvancedFeaturesDialog";
import { useAppColorMode } from "./useAppColorMode";
import { useAppSignOut } from "./useAppSignOut";

type AppSettingsDialog = "accessibility" | "advancedFeatures" | "admin";

export type AppSettingsMenuProps = Pick<
  SettingsMenuProps,
  "hideColorMode" | "side" | "align" | "tooltipSide"
>;

/**
 * The gear outside a game: the library's SettingsMenu with the app's own
 * settings and the dialogs they open. On the rail, pass `hideColorMode`;
 * the rail's `ColorModeToggle` sits above it.
 */
export function AppSettingsMenu(props: AppSettingsMenuProps) {
  const { hideColorMode, side, align, tooltipSide } = props;
  const { t } = useTranslation();

  const signedIn = useAuthStatus() === AuthStatus.Authenticated;
  const isAdmin = useAdminStore((state) => state.isAdmin);
  const { colorMode, setColorMode } = useAppColorMode();
  const signOut = useAppSignOut();

  const [openDialog, setOpenDialog] = useState<AppSettingsDialog | null>(null);
  const closeDialog = () => setOpenDialog(null);

  const handleSelect = (action: SettingsMenuAction) => {
    switch (action) {
      case "accessibility":
      case "advancedFeatures":
      case "admin":
        setOpenDialog(action);
        break;
      case "signOut":
        signOut();
        break;
    }
  };

  return (
    <>
      <SettingsMenu
        // Outside a game there is no theme to change yet.
        hideTheme
        hideColorMode={hideColorMode}
        isAdmin={isAdmin}
        signedIn={signedIn}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        onSelect={handleSelect}
        side={side}
        align={align}
        tooltipSide={tooltipSide}
        strings={{ triggerLabel: t("iron-link.app-settings", "App Settings") }}
      />
      <A11ySettingsDialog
        open={openDialog === "accessibility"}
        onClose={closeDialog}
      />
      <AdvancedFeaturesDialog
        open={openDialog === "advancedFeatures"}
        onClose={closeDialog}
      />
      {isAdmin && (
        <AdminDialog open={openDialog === "admin"} onClose={closeDialog} />
      )}
    </>
  );
}
