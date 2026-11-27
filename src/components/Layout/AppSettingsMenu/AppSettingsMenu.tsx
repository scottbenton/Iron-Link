import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { SettingsMenu, SettingsMenuAction, SettingsMenuProps } from "ui/layout";

import { useAdminStore } from "stores/admin.store";
import { useAppSettingsMenuStore } from "stores/appSettingsMenu.store";
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
 * The app's one settings menu: the library's SettingsMenu with the app's own
 * settings and the dialogs they open, plus whatever the page adds through
 * `useContributeAppSettings` (the game page's game and character sections,
 * Change Theme and the log sound). On the rail, pass `hideColorMode`; the
 * rail's `ColorModeToggle` sits above it.
 */
export function AppSettingsMenu(props: AppSettingsMenuProps) {
  const { hideColorMode, side, align, tooltipSide } = props;
  const { t } = useTranslation();

  const signedIn = useAuthStatus() === AuthStatus.Authenticated;
  const isAdmin = useAdminStore((state) => state.isAdmin);
  const { colorMode, setColorMode } = useAppColorMode();
  const signOut = useAppSignOut();
  const contribution = useAppSettingsMenuStore((state) => state.contribution);

  const [openDialog, setOpenDialog] = useState<AppSettingsDialog | null>(null);
  const closeDialog = () => setOpenDialog(null);

  // Until the game page moves to the library's Theme dialog, Change Theme
  // opens one level's theme, so its second line names that level.
  const themeTarget = contribution?.themeTarget;
  const strings = useMemo(
    () =>
      themeTarget
        ? {
            themeDescription: () =>
              themeTarget === "character"
                ? t("iron-link.settings.theme-character", "This character")
                : t("iron-link.settings.theme-game", "This game"),
          }
        : undefined,
    [t, themeTarget],
  );

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
      default:
        contribution?.onSelect(action);
    }
  };

  return (
    <>
      <SettingsMenu
        game={contribution?.game}
        character={contribution?.character}
        // Change Theme shows only where the page has a theme to change; the
        // app has none of its own yet.
        hideTheme={!themeTarget}
        hideColorMode={hideColorMode}
        isAdmin={isAdmin}
        signedIn={signedIn}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        logSound={contribution?.logSound}
        onLogSoundChange={contribution?.onLogSoundChange}
        onSelect={handleSelect}
        onDeleteCharacter={contribution?.onDeleteCharacter}
        onDeleteGame={contribution?.onDeleteGame}
        side={side}
        align={align}
        tooltipSide={tooltipSide}
        strings={strings}
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
