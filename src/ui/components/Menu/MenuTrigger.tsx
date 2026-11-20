import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ComponentProps, forwardRef } from "react";

import { Button } from "../Button";

export interface MenuTriggerProps
  extends Omit<ComponentProps<typeof BaseMenu.Trigger>, "className"> {
  className?: string;
}

/**
 * Opens the menu. Renders a Button unless given another through `render`,
 * such as `render={<IconButton label="App Settings"><GearIcon /></IconButton>}`.
 */
export const MenuTrigger = forwardRef<HTMLButtonElement, MenuTriggerProps>(
  function MenuTrigger(props, ref) {
    const { render, ...rest } = props;
    return (
      <BaseMenu.Trigger ref={ref} render={render ?? <Button />} {...rest} />
    );
  },
);
