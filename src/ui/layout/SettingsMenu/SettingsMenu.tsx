import { GearSixIcon } from "@phosphor-icons/react";
import { Fragment, useState } from "react";

import { IconButton } from "../../components/IconButton";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuSeparator,
  MenuTrigger,
} from "../../components/Menu";
import { DeleteConfirm } from "./DeleteConfirm";
import { SettingsItems } from "./SettingsItems";
import { PendingDelete, SharedMenuProps } from "./settingsMenuProps";
import {
  SettingsMenuContext,
  SettingsMenuGame,
  SettingsMenuSection,
  getSettingsMenuSections,
} from "./settingsMenuSections";
import {
  SettingsMenuColorMode,
  SettingsMenuStrings,
  SettingsMenuThemeScope,
} from "./settingsMenuStrings";
import { useSettingsMenuStrings } from "./useSettingsMenuStrings";

export interface SettingsMenuProps
  extends SettingsMenuContext,
    SharedMenuProps {
  /**
   * The colour mode now; the Dark Mode item shows it checked. Unused with
   * `hideColorMode`, where `ColorModeToggle` takes these instead.
   */
  colorMode?: SettingsMenuColorMode;
  onColorModeChange?: (mode: SettingsMenuColorMode) => void;
  /** The device's log sound setting, checked when on (shared games only). */
  logSound?: boolean;
  onLogSoundChange?: (on: boolean) => void;
  /** Called after the person confirms Delete Game. */
  onDeleteGame?: () => void;
}

function themeScope(game?: SettingsMenuGame): SettingsMenuThemeScope {
  if (!game) return "app";
  // A solo game with one character keeps its theme on the game.
  return game.solo && (game.characterCount ?? 1) < 2 ? "solo" : "game";
}

function headingFor(
  section: SettingsMenuSection,
  strings: SettingsMenuStrings,
  characterName?: string,
) {
  switch (section.id) {
    case "character":
      return strings.characterHeading(characterName ?? "");
    case "game":
      return strings.gameHeading;
    case "app":
      return strings.appHeading;
    default:
      // Change Theme names itself and covers every level.
      return undefined;
  }
}

/**
 * The one settings menu, from the gear on the nav rail or on a phone's top
 * bar. Its sections appear only where they apply, each under a small label:
 * the open character's settings (when the person can edit it), the game's
 * (inside a game; changes only for its Guides, plus the device's log sound
 * for everyone in a shared game), Change Theme (one item for every level,
 * opening the Theme dialog), then the app's. Each Delete is the last item of
 * its section and asks first. On the rail, pass `hideColorMode` and put a
 * `ColorModeToggle` above the gear; phones keep Dark Mode in the menu.
 */
export function SettingsMenu(props: SettingsMenuProps) {
  const {
    character,
    game,
    isAdmin,
    signedIn,
    hideColorMode,
    hideTheme,
    colorMode,
    onColorModeChange,
    logSound,
    onLogSoundChange,
    onSelect,
    onDeleteCharacter,
    onDeleteGame,
    trigger,
    side = "bottom",
    align = "end",
    tooltipSide,
    open,
    defaultOpen,
    onOpenChange,
  } = props;
  const strings = useSettingsMenuStrings(props.strings);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const sections = getSettingsMenuSections({
    character,
    game,
    isAdmin,
    signedIn,
    hideColorMode,
    hideTheme,
  });

  return (
    <>
      <Menu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <MenuTrigger
          render={
            trigger ?? (
              <IconButton
                label={strings.triggerLabel}
                tooltipSide={tooltipSide}
              >
                <GearSixIcon />
              </IconButton>
            )
          }
        />
        <MenuContent side={side} align={align}>
          {sections.map((section, index) => (
            <Fragment key={section.id}>
              {index > 0 && <MenuSeparator />}
              <MenuGroup label={headingFor(section, strings, character?.name)}>
                <SettingsItems
                  items={section.items}
                  strings={strings}
                  onSelect={onSelect}
                  onRequestDelete={setPendingDelete}
                  themeDescription={strings.themeDescription(themeScope(game))}
                  colorMode={colorMode}
                  onColorModeChange={onColorModeChange}
                  logSound={logSound}
                  onLogSoundChange={onLogSoundChange}
                />
              </MenuGroup>
            </Fragment>
          ))}
        </MenuContent>
      </Menu>
      <DeleteConfirm
        pending={pendingDelete}
        onDone={() => setPendingDelete(null)}
        strings={strings}
        characterName={character?.name}
        game={game}
        onDeleteCharacter={onDeleteCharacter}
        onDeleteGame={onDeleteGame}
      />
    </>
  );
}
