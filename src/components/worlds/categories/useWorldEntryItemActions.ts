import { useWorldEntriesStore } from "stores/worldEntries.store";

import { ReadPermissions } from "repositories/shared.types";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldEntry } from "services/worldEntries.service";

// What an entry's card or list row offers this reader: its menu's actions,
// and whether it shows the Guides-only lock.
export function useWorldEntryItemActions(
  entry: IWorldEntry,
  category: Pick<IWorldCategory, "supportsHierarchy">,
  guided: boolean,
) {
  const permissions = useWorldEntriesStore(
    (store) => store.entryState.permissions[entry.id],
  );
  const canShare = !!permissions?.canChangePermissions && guided;
  const canDelete = !!permissions?.canDelete;
  const canMove = !!permissions?.canEdit && category.supportsHierarchy;
  return {
    canShare,
    canMove,
    canDelete,
    hasMenu: canShare || canMove || canDelete,
    guidesOnly: guided && entry.readPermissions === ReadPermissions.OnlyGuides,
  };
}
