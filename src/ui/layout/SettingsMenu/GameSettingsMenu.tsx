import { GearSixIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { IconButton } from "../../components/IconButton";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuTrigger,
} from "../../components/Menu";
import { DeleteConfirm } from "./DeleteConfirm";
import { SettingsItems } from "./SettingsItems";
import { PendingDelete, SharedMenuProps } from "./settingsMenuProps";
import { SettingsMenuGame, getGameMenuItems } from "./settingsMenuSections";
import { useSettingsMenuStrings } from "./useSettingsMenuStrings";

export interface GameSettingsMenuProps extends SharedMenuProps {
  game: SettingsMenuGame;
  /**
   * Offer Change Theme, for the game's own theme. Leave out where the
   * person can't change it.
   */
  showTheme?: boolean;
  /** The device's log sound setting, checked when on (shared games only). */
  logSound?: boolean;
  onLogSoundChange?: (on: boolean) => void;
  /** Called after the person confirms Delete Game. */
  onDeleteGame?: () => void;
}

/**
 * The game overview's menu, beside the game's name: a shortcut to the
 * game's own settings (Change Name, Rulesets, the log sound, Change Theme,
 * Delete Game), with no character or app settings. The rail's SettingsMenu
 * has these too. Renders nothing when none apply.
 */
export function GameSettingsMenu(props: GameSettingsMenuProps) {
  const {
    game,
    showTheme,
    logSound,
    onLogSoundChange,
    onSelect,
    onDeleteGame,
    trigger,
    side = "bottom",
    align = "end",
    tooltipSide = "bottom",
    open,
    defaultOpen,
    onOpenChange,
  } = props;
  const strings = useSettingsMenuStrings(props.strings);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const items = getGameMenuItems(game, { theme: showTheme });
  if (items.length === 0) return null;

  return (
    <>
      <Menu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <MenuTrigger
          render={
            trigger ?? (
              <IconButton
                label={strings.gameTriggerLabel}
                size="sm"
                tooltipSide={tooltipSide}
              >
                <GearSixIcon />
              </IconButton>
            )
          }
        />
        <MenuContent side={side} align={align}>
          <MenuGroup label={strings.gameHeading}>
            <SettingsItems
              items={items}
              strings={strings}
              onSelect={onSelect}
              onRequestDelete={setPendingDelete}
              logSound={logSound}
              onLogSoundChange={onLogSoundChange}
            />
          </MenuGroup>
        </MenuContent>
      </Menu>
      <DeleteConfirm
        pending={pendingDelete}
        onDone={() => setPendingDelete(null)}
        strings={strings}
        game={game}
        onDeleteGame={onDeleteGame}
      />
    </>
  );
}
