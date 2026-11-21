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
import {
  SettingsMenuCharacter,
  SettingsMenuGame,
  getCharacterMenuItems,
} from "./settingsMenuSections";
import { useSettingsMenuStrings } from "./useSettingsMenuStrings";

export interface CharacterSettingsMenuProps extends SharedMenuProps {
  character: SettingsMenuCharacter;
  /** The game, for what applies (a solo game has no Edit Access). */
  game?: SettingsMenuGame;
}

/**
 * The character column's menu: a shortcut to that character's own actions
 * (Change Name or Portrait, Update Stats, Edit Access, Change Theme, Delete
 * Character), with no game or app settings. The rail's SettingsMenu has
 * these too.
 */
export function CharacterSettingsMenu(props: CharacterSettingsMenuProps) {
  const {
    character,
    game,
    onSelect,
    onDeleteCharacter,
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

  return (
    <>
      <Menu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <MenuTrigger
          render={
            trigger ?? (
              <IconButton
                label={strings.characterTriggerLabel}
                size="sm"
                tooltipSide={tooltipSide}
              >
                <GearSixIcon />
              </IconButton>
            )
          }
        />
        <MenuContent side={side} align={align}>
          <MenuGroup label={strings.characterHeading(character.name)}>
            <SettingsItems
              items={getCharacterMenuItems(character, game)}
              strings={strings}
              onSelect={onSelect}
              onRequestDelete={setPendingDelete}
            />
          </MenuGroup>
        </MenuContent>
      </Menu>
      <DeleteConfirm
        pending={pendingDelete}
        onDone={() => setPendingDelete(null)}
        strings={strings}
        characterName={character.name}
        onDeleteCharacter={onDeleteCharacter}
      />
    </>
  );
}
