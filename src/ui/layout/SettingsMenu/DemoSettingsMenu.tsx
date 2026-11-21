/**
 * The settings menus wired up for stories: the mode toggle and Dark Mode
 * switch the story's colour mode, Change Theme opens the Theme dialog with
 * the scenario's characters and game, and Delete asks first. Story-only:
 * the SettingsMenu stories and the Examples pages use it; nothing in the app
 * imports it.
 */
import { useState } from "react";

import { ColorModeToggle } from "./ColorModeToggle";
import { SettingsMenu, SettingsMenuProps } from "./SettingsMenu";
import { SettingsScenario } from "./settingsMenuScenarios";
import { SettingsMenuAction } from "./settingsMenuSections";
import { useStoryColorMode } from "./useStoryColorMode";
import { useThemeDialog } from "./useThemeDialog";

export interface DemoSettingsMenuProps
  extends Pick<
    SettingsMenuProps,
    "side" | "align" | "tooltipSide" | "trigger" | "strings"
  > {
  scenario: SettingsScenario;
  /** Other items (Theme opens its dialog here), such as Second Screen. */
  onSelect?: (action: SettingsMenuAction) => void;
  /** Called after a confirmed delete, to show it in the story. */
  onDeleted?: (what: "character" | "game") => void;
  /**
   * The nav rail's form: the mode toggle above the gear, and no Dark Mode
   * in the menu. Leave out on phones.
   */
  rail?: boolean;
}

/** The combined menu over a scenario, as the rail and phone pages use it. */
export function DemoSettingsMenu(props: DemoSettingsMenuProps) {
  const { scenario, onSelect, onDeleted, rail, ...rest } = props;
  const [colorMode, setColorMode] = useStoryColorMode();
  const [logSound, setLogSound] = useState(true);
  const theme = useThemeDialog(scenario);
  return (
    <>
      {rail && (
        <ColorModeToggle
          colorMode={colorMode}
          onColorModeChange={setColorMode}
          tooltipSide={rest.tooltipSide}
        />
      )}
      <SettingsMenu
        {...rest}
        character={scenario.character}
        game={scenario.game}
        isAdmin={scenario.isAdmin}
        signedIn={scenario.signedIn}
        hideColorMode={rail}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        logSound={logSound}
        onLogSoundChange={setLogSound}
        onSelect={(action) => {
          if (action === "theme") theme.openTheme();
          onSelect?.(action);
        }}
        onDeleteCharacter={() => onDeleted?.("character")}
        onDeleteGame={() => onDeleted?.("game")}
      />
      {theme.dialog}
    </>
  );
}
