import { EditPermissions, ReadPermissions } from "repositories/shared.types";

// An entry is either Guide prep or shared with everyone, who can then read
// and edit it (players keep notes on the people they meet). Only Guides of a
// guided world choose; in any other world every entry is shared.
export type WorldEntryVisibility = "guides" | "everyone";

export interface WorldEntryPermissionValues {
  readPermissions: ReadPermissions;
  editPermissions: EditPermissions;
}

// Entries saved before there were two choices may hold other settings; any
// entry players can read counts as shared.
export function getWorldEntryVisibility(
  readPermissions: ReadPermissions,
): WorldEntryVisibility {
  return readPermissions === ReadPermissions.OnlyGuides ? "guides" : "everyone";
}

export function getWorldEntryVisibilityPermissions(
  visibility: WorldEntryVisibility,
): WorldEntryPermissionValues {
  return visibility === "guides"
    ? {
        readPermissions: ReadPermissions.OnlyGuides,
        editPermissions: EditPermissions.OnlyGuides,
      }
    : {
        readPermissions: ReadPermissions.AllPlayers,
        editPermissions: EditPermissions.AllPlayers,
      };
}

// A Guide's new entries in a guided world start as their own prep; every
// other new entry starts shared.
export function getDefaultWorldEntryPermissions(
  isGuide: boolean,
  guided: boolean,
): WorldEntryPermissionValues {
  return getWorldEntryVisibilityPermissions(
    guided && isGuide ? "guides" : "everyone",
  );
}

// An entry created from a linked entry field starts as Guide prep when the
// field or the linking entry is, if its creator may make prep; otherwise it
// starts shared.
export function getLinkedWorldEntryPermissions(
  source: { readPermissions: ReadPermissions },
  {
    gmOnly,
    isGuide,
    guided,
  }: { gmOnly: boolean; isGuide: boolean; guided: boolean },
): WorldEntryPermissionValues {
  const prep =
    gmOnly || getWorldEntryVisibility(source.readPermissions) === "guides";
  return getWorldEntryVisibilityPermissions(
    prep && guided && isGuide ? "guides" : "everyone",
  );
}
