import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { ComponentProps } from "react";

export type ContextMenuProps = ComponentProps<typeof BaseContextMenu.Root>;

/**
 * A menu opened by right click or long press on an area. Fill
 * ContextMenuContent with the Menu items (MenuItem, MenuSeparator,
 * MenuGroup, ...). Every action in a context menu must also be reachable
 * another way, such as a menu button, since touch and keyboard users rarely
 * find it.
 */
export function ContextMenu(props: ContextMenuProps) {
  return <BaseContextMenu.Root {...props} />;
}
