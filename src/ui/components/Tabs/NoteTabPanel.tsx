import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { ComponentProps, forwardRef } from "react";

import { focusRing } from "ui/styles/focus";

import { css, cx } from "styled-system/css";

const panelStyles = css({
  flex: "1 1 auto",
  minHeight: 0,
  overflow: "auto",
  outline: "none",
  _focusVisible: focusRing.inset,
});

export interface NoteTabPanelProps
  extends Omit<ComponentProps<typeof BaseTabs.Panel>, "className"> {
  className?: string;
}

/**
 * A note's content, shown while its tab is open. It fills the rest of the
 * column and scrolls.
 */
export const NoteTabPanel = forwardRef<HTMLDivElement, NoteTabPanelProps>(
  function NoteTabPanel(props, ref) {
    const { className, ...rest } = props;
    return (
      <BaseTabs.Panel
        ref={ref}
        className={cx(panelStyles, className)}
        {...rest}
      />
    );
  },
);
