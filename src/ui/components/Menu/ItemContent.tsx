import { ReactNode } from "react";

import {
  menuItemDescriptionStyles,
  menuItemIconStyles,
  menuItemLabelStyles,
  menuItemShortcutStyles,
} from "./menuStyles";

export interface ItemContentProps {
  /** An icon before the label, like MUI's ListItemIcon. */
  icon?: ReactNode;
  /** A second line under the label. */
  description?: ReactNode;
  /** Right-hand text: a keyboard shortcut ("Ctrl K") or a short value. */
  shortcut?: ReactNode;
  /** Leave room for an icon on a row without one, so labels line up. */
  inset?: boolean;
  children?: ReactNode;
}

export function ItemContent(
  props: ItemContentProps & { indicator?: ReactNode },
) {
  const { icon, description, shortcut, children, indicator } = props;
  return (
    <>
      {indicator}
      {icon && (
        <span className={menuItemIconStyles} aria-hidden>
          {icon}
        </span>
      )}
      <span className={menuItemLabelStyles}>
        <span>{children}</span>
        {description && (
          <span className={menuItemDescriptionStyles}>{description}</span>
        )}
      </span>
      {shortcut && <span className={menuItemShortcutStyles}>{shortcut}</span>}
    </>
  );
}
