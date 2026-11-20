import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { ComponentProps, forwardRef } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

type RootProps = ComponentProps<typeof BaseCollapsible.Root>;

export interface CollapsibleProps
  extends Omit<RootProps, "className">,
    CssProp {
  className?: string;
}

/**
 * Shows and hides a panel with its trigger: `CollapsibleTrigger` and
 * `CollapsiblePanel` inside. Controlled with `open` and `onOpenChange`, or
 * uncontrolled with `defaultOpen`. For a panel without a trigger of its own,
 * use `Collapse`.
 */
export const Collapsible = forwardRef<HTMLDivElement, CollapsibleProps>(
  function Collapsible(props, ref) {
    const { className, ...rest } = withCssProp(props);
    return <BaseCollapsible.Root ref={ref} className={className} {...rest} />;
  },
);
