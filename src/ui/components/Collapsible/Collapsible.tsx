import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { CaretRight } from "@phosphor-icons/react";
import { ComponentProps, ReactNode, forwardRef } from "react";

import { css, cx } from "styled-system/css";

import { collapsiblePanelStyles } from "./collapsibleStyles";

type RootProps = ComponentProps<typeof BaseCollapsible.Root>;

export interface CollapsibleProps extends Omit<RootProps, "className"> {
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
    const { className, ...rest } = props;
    return <BaseCollapsible.Root ref={ref} className={className} {...rest} />;
  },
);

const triggerStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  boxSizing: "border-box",
  minHeight: "32px",
  margin: 0,
  paddingInline: "2",
  marginInline: "-2",
  border: 0,
  borderRadius: "sm",
  background: "transparent",
  color: "fg.default",
  fontFamily: "body",
  fontWeight: "semibold",
  fontSize: "sm",
  textAlign: "start",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  transition: "background-color token(durations.fast) linear",
  outline: "none",
  _hover: { background: "overlay.hover" },
  _pressed: { background: "overlay.pressed" },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "1px",
  },
  _disabled: { cursor: "not-allowed", color: "fg.disabled" },
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
  /** Hide the caret, for a trigger that shows its state another way. */
  hideCaret?: boolean;
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
  const { hideCaret, className, children, render, ...rest } = props;
  return (
    <BaseCollapsible.Trigger
      ref={ref}
      render={render}
      className={render ? className : cx(triggerStyles, className)}
      {...rest}
    >
      {!render && !hideCaret && (
        <CaretRight data-caret="" weight="bold" aria-hidden />
      )}
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
