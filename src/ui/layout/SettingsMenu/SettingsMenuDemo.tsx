/**
 * The settings menus wired up for stories: the mode toggle and Dark Mode
 * switch the story's colour mode, Change Theme opens the Theme dialog with
 * the scenario's characters and game, and Delete asks first. Story-only:
 * the SettingsMenu stories and the Examples pages use it; nothing in the app
 * imports it.
 */
import { ReactElement, useEffect, useState, useSyncExternalStore } from "react";

import { ThemeChoice, ThemeDialog, ThemeTarget } from "../../game/ThemeDialog";
import { sampleCharacters } from "../../stories/fixtures/characters";
import { SchemeName, applyUITheme } from "../../theme";
import { ColorModeToggle } from "./ColorModeToggle";
import {
  CharacterSettingsMenu,
  SettingsMenu,
  SettingsMenuProps,
} from "./SettingsMenu";
import { SettingsScenario, guideScenario } from "./settingsMenuScenarios";
import { SettingsMenuAction, SettingsMenuGame } from "./settingsMenuSections";
import { SettingsMenuColorMode } from "./settingsMenuStrings";

const [kira] = sampleCharacters;

function subscribeToColorMode(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function readColorMode(): SettingsMenuColorMode {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function writeColorMode(mode: SettingsMenuColorMode) {
  const root = document.documentElement;
  const scheme = (root.dataset.pandaTheme ?? "default") as SchemeName;
  applyUITheme({ mode, scheme }, root);
}

/**
 * The story's colour mode, read from the page so it follows the toolbar,
 * and switched on the page the way the app would. Leaving the story puts
 * back the toolbar's mode, so the next story doesn't inherit it.
 */
function useStoryColorMode() {
  const colorMode = useSyncExternalStore(
    subscribeToColorMode,
    readColorMode,
    () => "light" as const,
  );
  useEffect(() => {
    const toolbarMode = readColorMode();
    return () => writeColorMode(toolbarMode);
  }, []);
  return [colorMode, writeColorMode] as const;
}

/** Which row the Theme dialog opens on: the narrowest level in view. */
function getInitialThemeRow(scenario: SettingsScenario): ThemeTarget {
  if (scenario.currentCharacterId) {
    return { kind: "character", id: scenario.currentCharacterId };
  }
  return scenario.themeGame ? { kind: "game" } : { kind: "app" };
}

function useThemeDialog(scenario: SettingsScenario) {
  const [open, setOpen] = useState(false);
  const [characters, setCharacters] = useState(scenario.themeCharacters);
  const [game, setGame] = useState(scenario.themeGame);
  const [appTheme, setAppTheme] = useState<ThemeChoice>(null);
  const dialog = (
    <ThemeDialog
      open={open}
      onClose={() => setOpen(false)}
      characters={characters}
      currentCharacterId={scenario.currentCharacterId}
      game={game}
      appTheme={appTheme}
      initialOpen={getInitialThemeRow(scenario)}
      date={new Date(2026, 10, 18)}
      onSave={(changes) => {
        for (const { target, theme } of changes) {
          if (target.kind === "character") {
            setCharacters((previous) =>
              previous.map((character) =>
                character.id === target.id
                  ? { ...character, theme }
                  : character,
              ),
            );
          } else if (target.kind === "game") {
            setGame((previous) => previous && { ...previous, theme });
          } else {
            setAppTheme(theme);
          }
        }
      }}
    />
  );
  return { openTheme: () => setOpen(true), dialog };
}

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

export interface DemoCharacterSettingsMenuProps {
  scenario?: SettingsScenario;
  trigger?: ReactElement;
  onSelect?: (action: SettingsMenuAction) => void;
  onDeleted?: () => void;
}

/** The character column's shortcut menu over a scenario (Kira by default). */
export function DemoCharacterSettingsMenu(
  props: DemoCharacterSettingsMenuProps,
) {
  const { scenario = guideScenario, trigger, onSelect, onDeleted } = props;
  const theme = useThemeDialog(scenario);
  const character = scenario.character ?? { name: kira.name, isOwner: true };
  const game: SettingsMenuGame | undefined = scenario.game;
  return (
    <>
      <CharacterSettingsMenu
        character={character}
        game={game}
        trigger={trigger}
        onSelect={(action) => {
          if (action === "theme") theme.openTheme();
          onSelect?.(action);
        }}
        onDeleteCharacter={onDeleted}
      />
      {theme.dialog}
    </>
  );
}
