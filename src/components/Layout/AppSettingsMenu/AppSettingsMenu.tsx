import { Suspense, lazy, useState } from "react";

import { SettingsMenu, SettingsMenuAction, SettingsMenuProps } from "ui/layout";

import { useAdminStore } from "stores/admin.store";
import { useAppSettingsMenuStore } from "stores/appSettingsMenu.store";
import { AuthStatus, useAuthStatus } from "stores/auth.store";

import { A11ySettingsDialog } from "../A11ySettingsDialog";
import { AdminDialog } from "../AdminDialog";
import { AdvancedFeaturesDialog } from "../AdvancedFeaturesDialog";
import { useAppColorMode } from "./useAppColorMode";
import { useAppSignOut } from "./useAppSignOut";

// Loaded on first use: the Theme dialog and its scheme previews stay out of
// the entry chunk.
const AppThemeDialog = lazy(() =>
  import("./AppThemeDialog").then((module) => ({
    default: module.AppThemeDialog,
  })),
);

type AppSettingsDialog =
  | "accessibility"
  | "advancedFeatures"
  | "admin"
  | "theme";

export type AppSettingsMenuProps = Pick<
  SettingsMenuProps,
  "hideColorMode" | "side" | "align" | "tooltipSide"
>;

/**
 * The app's one settings menu: the library's SettingsMenu with the app's own
 * settings and the dialogs they open, plus whatever the page adds through
 * `useContributeAppSettings` (the game page's game and character sections
 * and the log sound). On the rail, pass `hideColorMode`; the
 * rail's `ColorModeToggle` sits above it.
 */
export function AppSettingsMenu(props: AppSettingsMenuProps) {
  const { hideColorMode, side, align, tooltipSide } = props;

  const signedIn = useAuthStatus() === AuthStatus.Authenticated;
  const isAdmin = useAdminStore((state) => state.isAdmin);
  const { colorMode, setColorMode } = useAppColorMode();
  const signOut = useAppSignOut();
  const contribution = useAppSettingsMenuStore((state) => state.contribution);

  const [openDialog, setOpenDialog] = useState<AppSettingsDialog | null>(null);
  // Stays mounted once opened, so it can animate closed.
  const [themeDialogUsed, setThemeDialogUsed] = useState(false);
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
      case "theme":
        // A page with a Theme dialog of its own (the game page) opens it;
        // elsewhere Change Theme sets the app theme alone.
        if (contribution) contribution.onSelect(action);
        else {
          setThemeDialogUsed(true);
          setOpenDialog("theme");
        }
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
      />
      <A11ySettingsDialog
        open={openDialog === "accessibility"}
        onClose={closeDialog}
      />
      <AdvancedFeaturesDialog
        open={openDialog === "advancedFeatures"}
        onClose={closeDialog}
      />
      {themeDialogUsed && (
        <Suspense fallback={null}>
          <AppThemeDialog open={openDialog === "theme"} onClose={closeDialog} />
        </Suspense>
      )}
      {isAdmin && (
        <AdminDialog open={openDialog === "admin"} onClose={closeDialog} />
      )}
    </>
  );
}
