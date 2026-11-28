import { Menu as BaseMenu } from "@base-ui/react/menu";
import { forwardRef } from "react";

import { ToolbarButton, ToolbarButtonProps } from "./ToolbarButton";

export type ToolbarMenuButtonProps = Omit<ToolbarButtonProps, "render">;

/**
 * A toolbar button that opens a menu: put it inside a `Menu`, beside its
 * `MenuContent`. It joins the toolbar's arrow keys and marks itself
 * expanded while the menu is open.
 */
export const ToolbarMenuButton = forwardRef<
  HTMLButtonElement,
  ToolbarMenuButtonProps
>(function ToolbarMenuButton(props, ref) {
  return <ToolbarButton ref={ref} render={<BaseMenu.Trigger />} {...props} />;
});
