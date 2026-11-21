import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { ComponentProps, forwardRef } from "react";

import { cx } from "styled-system/css";

import { collapsiblePanelStyles } from "./collapsibleStyles";

export interface CollapsiblePanelProps
  extends Omit<ComponentProps<typeof BaseCollapsible.Panel>, "className"> {
  className?: string;
}

/** The content that opens and closes, animating its height. */
export const CollapsiblePanel = forwardRef<
  HTMLDivElement,
  CollapsiblePanelProps
>(function CollapsiblePanel(props, ref) {
  const { className, ...rest } = props;
  return (
    <BaseCollapsible.Panel
      ref={ref}
      className={cx(collapsiblePanelStyles, className)}
      {...rest}
    />
  );
});
