import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { CaretRight } from "@phosphor-icons/react";
import { ComponentProps, forwardRef } from "react";

import { focusRing } from "ui/styles/focus";
import { quietPressable } from "ui/styles/pressable";

import { css, cx } from "styled-system/css";

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
