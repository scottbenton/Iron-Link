import { useConfirm } from "material-ui-confirm";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { IWorldEntryConnection } from "services/worldEntryBonds.service";

import { useWorldBondActions } from "./useWorldBondActions";
import type { WorldBondCharacter } from "./useWorldBondCharacters";

// Takes a character out of a connection. Leaving a shared one needs no
// confirmation; the last member out removes the connection and its progress,
// so that asks first.
export function useLeaveConnection(
  actions: ReturnType<typeof useWorldBondActions>,
) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  return useCallback(
    (
      entry: { id: string; name: string },
      connection: IWorldEntryConnection,
      memberCount: number,
      member: WorldBondCharacter,
    ) => {
      const key = { entryId: entry.id, characterId: member.id };
      if (memberCount > 1) {
        actions.leaveConnection(key);
        return;
      }
      confirm({
        title: t("worlds.bonds.remove-title", "Remove connection?"),
        description:
          connection.ticks > 0 || connection.bonded
            ? t(
                "worlds.bonds.remove-progress",
                "This removes {{name}}'s connection with {{entry}} and its progress. Their Bonds track keeps anything already marked.",
                { name: member.name, entry: entry.name },
              )
            : t(
                "worlds.bonds.remove-description",
                "This removes {{name}}'s connection with {{entry}}.",
                { name: member.name, entry: entry.name },
              ),
        confirmationText: t("worlds.bonds.remove", "Remove"),
      })
        .then(({ confirmed }) => {
          if (confirmed) actions.leaveConnection(key);
        })
        .catch(() => {});
    },
    [actions, confirm, t],
  );
}
