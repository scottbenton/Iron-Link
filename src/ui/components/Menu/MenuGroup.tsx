import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ReactNode } from "react";

import { menuGroupLabelStyles } from "./menuStyles";

export interface MenuGroupProps {
  /**
   * A small heading over the group, which also names it. Replaces MUI's
   * ListSubheader inside menus.
   */
  label?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function MenuGroup(props: MenuGroupProps) {
  const { label, children, className } = props;
  return (
    <BaseMenu.Group className={className}>
      {label && (
        <BaseMenu.GroupLabel className={menuGroupLabelStyles}>
          {label}
        </BaseMenu.GroupLabel>
      )}
      {children}
    </BaseMenu.Group>
  );
}
