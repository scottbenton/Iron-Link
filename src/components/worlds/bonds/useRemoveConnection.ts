import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useConfirm } from "ui/components/ConfirmDialog";

import { IWorldEntryConnection } from "services/worldEntryBonds.service";

import { useWorldBondActions } from "./useWorldBondActions";

// Removes a connection, asking first when that would lose progress.
export function useRemoveConnection(
  actions: ReturnType<typeof useWorldBondActions>,
) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  return useCallback(
    (entryName: string, connection: IWorldEntryConnection) => {
      if (connection.ticks === 0 && !connection.bonded) {
        actions.removeConnection(connection.id);
        return;
      }
      confirm({
        title: t("worlds.bonds.remove-title", "Remove connection?"),
        description: t(
          "worlds.bonds.remove-progress",
          "This removes the connection with {{entry}} and its progress. Bonds tracks keep anything already marked.",
          { entry: entryName },
        ),
        confirmationText: t("worlds.bonds.remove", "Remove"),
      })
        .then(({ confirmed }) => {
          if (confirmed) actions.removeConnection(connection.id);
        })
        .catch(() => {});
    },
    [actions, confirm, t],
  );
}
