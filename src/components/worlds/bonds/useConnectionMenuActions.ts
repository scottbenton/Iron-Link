import { useTranslation } from "react-i18next";

import { IWorldEntryConnection } from "services/worldEntryBonds.service";

import type { WorldConnectionMenuAction } from "./WorldConnectionRow";
import { useRemoveConnection } from "./useRemoveConnection";
import { useWorldBondActions } from "./useWorldBondActions";
import type { WorldBondCharacter } from "./useWorldBondCharacters";

// Who shares a connection: its character, or every character of the game.
export function getConnectionMembers(
  connection: IWorldEntryConnection,
  characters: WorldBondCharacter[],
): WorldBondCharacter[] {
  return connection.characterId === null
    ? characters
    : characters.filter((character) => character.id === connection.characterId);
}

// The connection's menu: share it with the party or keep it for one
// character, and remove it. Sharing waits until no one else in the game has
// their own connection with the entry, since the party shares only one.
export function useConnectionMenuActions(
  actions: ReturnType<typeof useWorldBondActions>,
) {
  const { t } = useTranslation();
  const remove = useRemoveConnection(actions);
  return (
    entryName: string,
    connection: IWorldEntryConnection,
    characters: WorldBondCharacter[],
    othersConnected: boolean,
  ): WorldConnectionMenuAction[] => {
    const members = getConnectionMembers(connection, characters);
    if (!members.some((member) => member.canEdit)) return [];
    const menu: WorldConnectionMenuAction[] = [];
    if (connection.characterId !== null && characters.length > 1) {
      menu.push({
        key: "share",
        label: t("worlds.bonds.share-party", "Share with the party"),
        disabled: othersConnected,
        secondary: othersConnected
          ? t(
              "worlds.bonds.share-party-blocked",
              "Others in the party have their own connection",
            )
          : undefined,
        onClick: () =>
          actions.updateConnection(connection.id, { characterId: null }),
      });
    }
    if (connection.characterId === null && characters.length > 1) {
      characters
        .filter((character) => character.canEdit)
        .forEach((character) =>
          menu.push({
            key: `keep:${character.id}`,
            label: t("worlds.bonds.keep-for", "Keep for {{name}} only", {
              name: character.name,
            }),
            onClick: () =>
              actions.updateConnection(connection.id, {
                characterId: character.id,
              }),
          }),
        );
    }
    menu.push({
      key: "remove",
      label: t("worlds.bonds.remove-connection", "Remove connection"),
      onClick: () => remove(entryName, connection),
    });
    return menu;
  };
}
