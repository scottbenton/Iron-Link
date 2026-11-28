import { useTranslation } from "react-i18next";

import { IconButton } from "ui/components/IconButton";
import { MenuTrigger } from "ui/components/Menu";
import { DotsThreeIcon } from "ui/icons";

import { NoteItemActionMenu } from "./NoteItemActionMenu";
import { type NoteItemRef, useNoteItemActions } from "./useNoteItemActions";

export interface NoteItemCardMenuProps {
  item: NoteItemRef;
}

/** The actions button at the end of a folder's or note's card. */
export function NoteItemCardMenu(props: NoteItemCardMenuProps) {
  const { item } = props;
  const { t } = useTranslation();
  const { actions, name, dialogs } = useNoteItemActions(item);

  const isFolder = item.type === "folder";
  const label = name
    ? isFolder
      ? t("notes.folder-menu.open-named", "{{name}} actions", { name })
      : t("notes.note-menu.open-named", "{{name}} actions", { name })
    : isFolder
      ? t("notes.folder-menu.open", "Folder actions")
      : t("notes.note-menu.open", "Open Note Menu");

  return (
    <>
      <NoteItemActionMenu
        actions={actions}
        trigger={
          <MenuTrigger
            render={
              <IconButton label={label} size="sm">
                <DotsThreeIcon weight="bold" />
              </IconButton>
            }
          />
        }
      />
      {dialogs}
    </>
  );
}
