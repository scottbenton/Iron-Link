import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { CaretRight } from "@phosphor-icons/react";
import { ComponentProps, ReactNode, forwardRef } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";
import { focusRing } from "ui/styles/focus";
import { quietPressable } from "ui/styles/pressable";

import { css, cx } from "styled-system/css";

import { collapsiblePanelStyles } from "./collapsibleStyles";

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

const triggerStyles = css({
  ...quietPressable,
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  minHeight: "control.sm",
  paddingInline: "2",
  marginInline: "-2",
  borderRadius: "sm",
  color: "fg.default",
  fontFamily: "body",
  fontWeight: "semibold",
  fontSize: "sm",
  textAlign: "start",
  _focusVisible: focusRing.outset,
  _touch: { minHeight: "touch" },
  "& [data-caret]": {
    flex: "none",
    width: "14px",
    height: "14px",
    color: "fg.muted",
    transition: "rotate token(durations.normal) token(easings.out)",
    _reducedMotion: { transition: "none" },
  },
  "&[data-panel-open] [data-caret]": { rotate: "90deg" },
});

export interface CollapsibleTriggerProps
  extends Omit<ComponentProps<typeof BaseCollapsible.Trigger>, "className"> {
  className?: string;
}

/**
 * The button that opens and closes the panel. Styled as a quiet disclosure
 * with a caret that turns; pass `render` to use another button.
 */
export const CollapsibleTrigger = forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps
>(function CollapsibleTrigger(props, ref) {
  const { className, children, render, ...rest } = props;
  return (
    <BaseCollapsible.Trigger
      ref={ref}
      render={render}
      className={render ? className : cx(triggerStyles, className)}
      {...rest}
    >
      {!render && <CaretRight data-caret="" weight="bold" aria-hidden />}
      {children}
    </BaseCollapsible.Trigger>
  );
});

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
