import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { ComponentProps, forwardRef } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";
import { focusRing } from "ui/styles/focus";

import { css, cx } from "styled-system/css";

const panelStyles = css({
  outline: "none",
  borderRadius: "xs",
  _focusVisible: focusRing.outset,
});

export interface TabPanelProps
  extends Omit<ComponentProps<typeof BaseTabs.Panel>, "className">,
    CssProp {
  className?: string;
}

/** The content shown while the tab with the same `value` is selected. */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  function TabPanel(props, ref) {
    const { className, ...rest } = withCssProp(props);
    return (
      <BaseTabs.Panel
        ref={ref}
        className={cx(panelStyles, className)}
        {...rest}
      />
    );
  },
);
