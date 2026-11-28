import { ReactNode } from "react";

import { Menu, MenuContent, MenuItem } from "ui/components/Menu";

import type { NoteItemAction } from "./useNoteItemActions";

export interface NoteItemActionMenuProps {
  actions: NoteItemAction[];
  /** The button that opens it: a `MenuTrigger`, or a toolbar's menu button. */
  trigger: ReactNode;
  align?: "start" | "center" | "end";
}

/** A folder's or note's actions as a menu. Nothing renders without any. */
export function NoteItemActionMenu(props: NoteItemActionMenuProps) {
  const { actions, trigger, align = "end" } = props;
  if (actions.length === 0) return null;
  return (
    <Menu>
      {trigger}
      <MenuContent align={align}>
        {actions.map((action) => (
          <MenuItem
            key={action.id}
            icon={action.icon}
            tone={action.danger ? "danger" : undefined}
            onClick={action.onSelect}
          >
            {action.label}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
