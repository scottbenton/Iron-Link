import { Popover as BasePopover } from "@base-ui/react/popover";
import { ComponentProps } from "react";

export type PopoverProps = ComponentProps<typeof BasePopover.Root>;

/**
 * A small non-modal panel of content or controls anchored to a button, such
 * as a stat's details or a quick filter. Escape and a press outside close
 * it. For a list of actions use Menu; for a short hint use Tooltip.
 */
export function Popover(props: PopoverProps) {
  return <BasePopover.Root {...props} />;
}
