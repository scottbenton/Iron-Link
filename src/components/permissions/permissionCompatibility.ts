import { EditPermissions, ReadPermissions } from "repositories/shared.types";

export interface PermissionOption<T extends string> {
  label: string;
  value: T;
}

// Who can read under each read permission, by audience. Public reaches
// everyone all players do, and more.
const READ_AUDIENCES: Record<ReadPermissions, Set<EditPermissions>> = {
  [ReadPermissions.OnlyAuthor]: new Set([EditPermissions.OnlyAuthor]),
  [ReadPermissions.OnlyGuides]: new Set([EditPermissions.OnlyGuides]),
  [ReadPermissions.GuidesAndAuthor]: new Set([
    EditPermissions.OnlyAuthor,
    EditPermissions.OnlyGuides,
    EditPermissions.GuidesAndAuthor,
  ]),
  [ReadPermissions.AllPlayers]: new Set(Object.values(EditPermissions)),
  [ReadPermissions.Public]: new Set(Object.values(EditPermissions)),
};

// Edit access can never reach anyone who cannot read the item.
export function isEditPermissionWithinReadPermission(
  readPermission: ReadPermissions,
  editPermission: EditPermissions,
): boolean {
  return READ_AUDIENCES[readPermission].has(editPermission);
}

// The edit permission to keep after the read permission changes: the current
// one while it still fits, otherwise the first offered option that does.
export function getCompatibleEditPermission(
  readPermission: ReadPermissions,
  editPermission: EditPermissions,
  editOptions: PermissionOption<EditPermissions>[],
): EditPermissions {
  if (isEditPermissionWithinReadPermission(readPermission, editPermission))
    return editPermission;
  return (
    editOptions.find((option) =>
      isEditPermissionWithinReadPermission(readPermission, option.value),
    )?.value ?? editPermission
  );
}
