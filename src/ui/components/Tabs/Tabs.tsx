import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { ComponentProps, forwardRef } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

type BaseRootProps = ComponentProps<typeof BaseTabs.Root>;

export interface TabsProps extends Omit<BaseRootProps, "className">, CssProp {
  className?: string;
}

/**
 * Holds a set of tabs and their panels: `SectionTabList` with `SectionTab`s,
 * then a `TabPanel` per tab. Controlled with `value` and `onValueChange`, or
 * uncontrolled with `defaultValue`.
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  function Tabs(props, ref) {
    const { className, ...rest } = withCssProp(props);
    return <BaseTabs.Root ref={ref} className={className} {...rest} />;
  },
);
