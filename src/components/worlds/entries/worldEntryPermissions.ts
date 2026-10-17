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
// everyone and editable by Guides and themselves. A world that is not guided
// has nobody to hide anything from, so entries start shared.
export function getDefaultWorldEntryPermissions(
  isGuide: boolean,
  guided: boolean,
): { readPermissions: ReadPermissions; editPermissions: EditPermissions } {
  if (guided && isGuide) {
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

// An entry created from a linked entry field starts shared like the entry
// linking to it, and one created from a Guide-only field starts as Guide
// prep. Settings the creator could not pick for themselves fall back to
// their defaults, since the database would reject them.
//
// Copying an author-scoped read permission only works for the entry's own
// author: anyone else, typically a Guide filling in a player's entry, would
// author an entry the player cannot read, and a link to an entry someone
// cannot read hides the whole field value from them and refuses their later
// saves. Those entries start shared with everyone instead.
export function getLinkedWorldEntryPermissions(
  t: TFunction,
  source: {
    authorId: string;
    readPermissions: ReadPermissions;
    editPermissions: EditPermissions;
  },
  {
    uid,
    gmOnly,
    isGuide,
    guided,
  }: {
    uid: string;
    gmOnly: boolean;
    isGuide: boolean;
    guided: boolean;
  },
): { readPermissions: ReadPermissions; editPermissions: EditPermissions } {
  if (gmOnly) {
    return getAllowedWorldEntryPermissions(
      t,
      {
        readPermissions: ReadPermissions.OnlyGuides,
        editPermissions: EditPermissions.OnlyGuides,
      },
      isGuide,
      guided,
    );
  }
  const authorScoped =
    source.readPermissions === ReadPermissions.OnlyAuthor ||
    source.readPermissions === ReadPermissions.GuidesAndAuthor;
  if (authorScoped && source.authorId !== uid) {
    return {
      readPermissions: ReadPermissions.AllPlayers,
      editPermissions: EditPermissions.GuidesAndAuthor,
    };
  }
  return getAllowedWorldEntryPermissions(
    t,
    {
      readPermissions: source.readPermissions,
      editPermissions: source.editPermissions,
    },
    isGuide,
    guided,
  );
}

function getAllowedWorldEntryPermissions(
  t: TFunction,
  wanted: {
    readPermissions: ReadPermissions;
    editPermissions: EditPermissions;
  },
  isGuide: boolean,
  guided: boolean,
): { readPermissions: ReadPermissions; editPermissions: EditPermissions } {
  const { readOptions, editOptions } = getWorldEntryPermissionOptions(t, {
    isAuthor: true,
    isGuide,
  });
  const allowed =
    readOptions.some((option) => option.value === wanted.readPermissions) &&
    editOptions.some((option) => option.value === wanted.editPermissions);
  return allowed ? wanted : getDefaultWorldEntryPermissions(isGuide, guided);
}
