import { useTranslation } from "react-i18next";

import { ToolbarMenuButton } from "ui/components/Toolbar";
import { DotsThreeIcon } from "ui/icons";

import { NoteItemAction, NoteItemActionMenu } from "../NoteItemActions";

export interface NoteActionsMenuProps {
  actions: NoteItemAction[];
}

// The open note's own actions, at the end of its toolbar.
export function NoteActionsMenu(props: NoteActionsMenuProps) {
  const { actions } = props;
  const { t } = useTranslation();
  return (
    <NoteItemActionMenu
      actions={actions}
      trigger={
        <ToolbarMenuButton
          label={t("note.editor-toolbar.note-actions", "Note actions")}
          icon={<DotsThreeIcon weight="bold" />}
        />
      }
    />
  );
}
