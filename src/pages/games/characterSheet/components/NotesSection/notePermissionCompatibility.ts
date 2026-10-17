import { EditPermissions, ReadPermissions } from "repositories/shared.types";

// Notes only keep edit access from reaching past the readers it names: all
// players need a note all players can read, and Guides need one they can
// read. Editing by the author alone always fits, including in Guide folders.
export function isNoteEditPermissionAllowed(
  readPermission: ReadPermissions,
  editPermission: EditPermissions,
): boolean {
  switch (editPermission) {
    case EditPermissions.AllPlayers:
      return (
        readPermission === ReadPermissions.AllPlayers ||
        readPermission === ReadPermissions.Public
      );
    case EditPermissions.GuidesAndAuthor:
      return readPermission !== ReadPermissions.OnlyAuthor;
    default:
      return true;
  }
}
