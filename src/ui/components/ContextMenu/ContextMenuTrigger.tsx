import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { ComponentProps } from "react";

export interface ContextMenuTriggerProps
  extends Omit<ComponentProps<typeof BaseContextMenu.Trigger>, "className"> {
  className?: string;
}

/** The area that opens the menu. Renders a div unless given `render`. */
export function ContextMenuTrigger(props: ContextMenuTriggerProps) {
  return <BaseContextMenu.Trigger {...props} />;
}
