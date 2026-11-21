import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { CaretDown } from "@phosphor-icons/react";
import { ReactNode, forwardRef } from "react";

import { focusRing } from "ui/styles/focus";
import { quietPressable } from "ui/styles/pressable";

import { css, cx } from "styled-system/css";

import { useHeadingComponent } from "../HeadingOffset";

const headerStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  margin: 0,
  font: "inherit",
  "&:has(> [data-accordion-actions])": { paddingInlineEnd: "2" },
});

const triggerStyles = css({
  ...quietPressable,
  flex: "1 1 auto",
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: "3",
  minHeight: "touch",
  paddingBlock: "3",
  paddingInline: "4",
  color: "fg.default",
  fontFamily: "body",
  textAlign: "start",
  _focusVisible: focusRing.inset,
  "& [data-caret]": {
    flex: "none",
    width: "16px",
    height: "16px",
    marginInlineStart: "auto",
    color: "fg.muted",
    transition: "rotate token(durations.normal) token(easings.out)",
    _reducedMotion: { transition: "none" },
  },
  "&[data-panel-open] [data-caret]": { rotate: "180deg" },
  "& [data-icon]": {
    flex: "none",
    display: "inline-flex",
    color: "fg.muted",
    "& svg": { width: "icon.md", height: "icon.md" },
  },
});

const titleStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "0.5",
  minWidth: 0,
  "& [data-title]": {
    fontFamily: "heading",
    fontWeight: "bold",
    fontSize: "md",
    lineHeight: "snug",
    letterSpacing: "0.01em",
  },
  "& [data-description]": {
    fontSize: "sm",
    lineHeight: "snug",
    color: "fg.muted",
  },
});

export interface AccordionTriggerProps {
  /** The section's title. */
  children: ReactNode;
  /** A line under the title, such as a count or a summary. */
  description?: ReactNode;
  /** An icon before the title. */
  icon?: ReactNode;
  /**
   * Buttons beside the trigger, such as Edit or Delete. They sit in the
   * heading next to the trigger, never inside it.
   */
  actions?: ReactNode;
  /**
   * The heading element. Headings nest by section, so pick the level that
   * follows the heading above (CLAUDE.md). A surrounding `HeadingOffset`
   * shifts it.
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  disabled?: boolean;
  className?: string;
}

/** A section's heading and the button that opens it. */
export const AccordionTrigger = forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(function AccordionTrigger(props, ref) {
  const {
    children,
    description,
    icon,
    actions,
    headingLevel = 3,
    disabled,
    className,
  } = props;
  const Heading = useHeadingComponent(headingLevel);
  return (
    <BaseAccordion.Header render={<Heading />} className={headerStyles}>
      <BaseAccordion.Trigger
        ref={ref}
        disabled={disabled}
        className={cx(triggerStyles, className)}
      >
        {icon && (
          <span data-icon="" aria-hidden>
            {icon}
          </span>
        )}
        <span className={titleStyles}>
          <span data-title="">{children}</span>
          {description && <span data-description="">{description}</span>}
        </span>
        <CaretDown data-caret="" weight="bold" aria-hidden />
      </BaseAccordion.Trigger>
      {actions && (
        <span
          data-accordion-actions=""
          className={css({ display: "flex", gap: "1", flex: "none" })}
        >
          {actions}
        </span>
      )}
    </BaseAccordion.Header>
  );
});
