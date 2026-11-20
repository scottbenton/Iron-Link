import { Popover as BasePopover } from "@base-ui/react/popover";
import { ComponentProps, forwardRef } from "react";

import { Button } from "../Button";

export interface PopoverTriggerProps
  extends Omit<ComponentProps<typeof BasePopover.Trigger>, "className"> {
  className?: string;
}

/** Opens the popover. Renders a Button unless given another through `render`. */
export const PopoverTrigger = forwardRef<
  HTMLButtonElement,
  PopoverTriggerProps
>(function PopoverTrigger(props, ref) {
  const { render, ...rest } = props;
  return (
    <BasePopover.Trigger ref={ref} render={render ?? <Button />} {...rest} />
  );
});
