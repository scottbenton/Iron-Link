import type { TFunction } from "i18next";

import type { PermissionOption } from "components/permissions/permissionCompatibility";

import { EditPermissions, ReadPermissions } from "repositories/shared.types";

export interface WorldEntryPermissionOptions {
  readOptions: PermissionOption<ReadPermissions>[];
  editOptions: PermissionOption<EditPermissions>[];
}

// World entries are shared across the world rather than one game, so every
// audience is offered regardless of game type. "Only the author" is offered
// only to the author, and "Guides only" only to Guides: the database rejects
// edit settings that exclude the person saving them, and a new entry its
// author could not read.
export function getWorldEntryPermissionOptions(
  t: TFunction,
  { isAuthor, isGuide }: { isAuthor: boolean; isGuide: boolean },
): WorldEntryPermissionOptions {
  const readOptions: PermissionOption<ReadPermissions>[] = [];
  const editOptions: PermissionOption<EditPermissions>[] = [];
  const addOption = (
    label: string,
    read: ReadPermissions,
    edit: EditPermissions,
  ) => {
    readOptions.push({ label, value: read });
    editOptions.push({ label, value: edit });
  };

  if (isAuthor) {
    addOption(
      t("worlds.entries.permissions.only-you", "Only you"),
      ReadPermissions.OnlyAuthor,
      EditPermissions.OnlyAuthor,
    );
  }
  addOption(
    isAuthor
      ? t("worlds.entries.permissions.guides-and-you", "Guides and you")
      : t(
          "worlds.entries.permissions.guides-and-author",
          "Guides and the author",
        ),
    ReadPermissions.GuidesAndAuthor,
    EditPermissions.GuidesAndAuthor,
  );
  if (isGuide) {
    addOption(
      t("worlds.entries.permissions.only-guides", "Guides only"),
      ReadPermissions.OnlyGuides,
      EditPermissions.OnlyGuides,
    );
  }
  addOption(
    t("worlds.entries.permissions.all-players", "All players"),
    ReadPermissions.AllPlayers,
    EditPermissions.AllPlayers,
  );
  return { readOptions, editOptions };
}

// A Guide's new entries start as their own prep; a player's start shared with
// everyone and editable by Guides and themselves. Without permission controls
// nobody could tell the difference, so entries start shared.
export function getDefaultWorldEntryPermissions(
  isGuide: boolean,
  permissionControlsShown: boolean,
): { readPermissions: ReadPermissions; editPermissions: EditPermissions } {
  if (permissionControlsShown && isGuide) {
    return {
      readPermissions: ReadPermissions.OnlyGuides,
      editPermissions: EditPermissions.OnlyGuides,
    };
  }
  return {
    readPermissions: ReadPermissions.AllPlayers,
    editPermissions: EditPermissions.GuidesAndAuthor,
  };
}
