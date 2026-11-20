import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ComponentProps } from "react";

export type MenuProps = ComponentProps<typeof BaseMenu.Root>;

/**
 * A menu of actions opened from a button. Compose it from MenuTrigger and
 * MenuContent; arrow keys move between items, typing jumps to a label, and
 * Escape closes it and returns focus to the trigger. Pass `open` and
 * `onOpenChange` to control it.
 */
export function Menu(props: MenuProps) {
  return <BaseMenu.Root {...props} />;
}
