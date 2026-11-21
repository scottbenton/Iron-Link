import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { ReactNode } from "react";

import { cx } from "styled-system/css";

import { collapsiblePanelStyles } from "./collapsibleStyles";

export interface CollapseProps {
  /** Whether the content shows. */
  open: boolean;
  children: ReactNode;
  /** Keep the content in the DOM while closed, for state or find in page. */
  keepMounted?: boolean;
  /** An id for the panel, for a trigger's `aria-controls`. */
  id?: string;
  className?: string;
}

/**
 * A panel that opens and closes with its height animated, driven by `open`
 * from elsewhere: the replacement for MUI's `Collapse`. The control that
 * opens it should say `aria-expanded` and `aria-controls={id}`.
 */
export function Collapse(props: CollapseProps) {
  const { open, children, keepMounted, id, className } = props;
  return (
    <BaseCollapsible.Root open={open}>
      <BaseCollapsible.Panel
        id={id}
        keepMounted={keepMounted}
        className={cx(collapsiblePanelStyles, className)}
      >
        {children}
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}
