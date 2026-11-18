import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { CaretDown } from "@phosphor-icons/react";
import { ComponentProps, ReactNode, forwardRef } from "react";

import { css, cx } from "styled-system/css";

/** One bordered surface, the items divided by hairlines. */
const rootStyles = css({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  fontFamily: "body",
  color: "fg.default",
  border: "1px solid token(colors.border.default)",
  borderRadius: "lg",
  background: "bg.surface",
  overflow: "hidden",
});

const itemStyles = css({
  boxSizing: "border-box",
  "& + &": { borderTop: "1px solid token(colors.border.subtle)" },
});

const headerStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  margin: 0,
  font: "inherit",
  "&:has(> [data-accordion-actions])": { paddingInlineEnd: "2" },
});

const triggerStyles = css({
  flex: "1 1 auto",
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: "3",
  boxSizing: "border-box",
  minHeight: "48px",
  margin: 0,
  paddingBlock: "3",
  paddingInline: "4",
  border: 0,
  background: "transparent",
  color: "fg.default",
  fontFamily: "body",
  textAlign: "start",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  transition: "background-color token(durations.fast) linear",
  outline: "none",
  _hover: { background: "overlay.hover" },
  _pressed: { background: "overlay.pressed" },
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "-2px",
  },
  _disabled: { cursor: "not-allowed", color: "fg.disabled" },
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
    "& svg": { width: "20px", height: "20px" },
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

const panelStyles = css({
  overflow: "hidden",
  boxSizing: "border-box",
  height: "var(--accordion-panel-height)",
  transitionProperty: "height",
  transitionDuration: "normal",
  transitionTimingFunction: "out",
  _startingStyle: { height: 0 },
  _endingStyle: {
    height: 0,
    transitionDuration: "fast",
    transitionTimingFunction: "in",
  },
  "&[hidden]:not([hidden=until-found])": { display: "none" },
  _reducedMotion: { transitionDuration: "0s" },
});

const panelContentStyles = css({
  paddingInline: "4",
  paddingBottom: "4",
  paddingTop: "1",
  fontSize: "sm",
  lineHeight: "normal",
  color: "fg.default",
});

type RootProps = ComponentProps<typeof BaseAccordion.Root>;

export interface AccordionProps extends Omit<RootProps, "className"> {
  className?: string;
}

/**
 * Sections that open and close under their headings. One opens at a time
 * unless `multiple`. The value is the open items' values, controlled with
 * `value`/`onValueChange` or uncontrolled with `defaultValue`.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  function Accordion(props, ref) {
    const { className, ...rest } = props;
    return (
      <BaseAccordion.Root
        ref={ref}
        className={cx(rootStyles, className)}
        {...rest}
      />
    );
  },
);

type ItemProps = ComponentProps<typeof BaseAccordion.Item>;

export interface AccordionItemProps extends Omit<ItemProps, "className"> {
  className?: string;
}

/** One section: an `AccordionTrigger` and an `AccordionPanel`. */
export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  function AccordionItem(props, ref) {
    const { className, ...rest } = props;
    return (
      <BaseAccordion.Item
        ref={ref}
        className={cx(itemStyles, className)}
        {...rest}
      />
    );
  },
);

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
   * follows the heading above (CLAUDE.md).
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
  const Heading = `h${headingLevel}` as const;
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

type PanelProps = ComponentProps<typeof BaseAccordion.Panel>;

export interface AccordionPanelProps extends Omit<PanelProps, "className"> {
  className?: string;
}

/** A section's content. Its height animates as it opens and closes. */
export const AccordionPanel = forwardRef<HTMLDivElement, AccordionPanelProps>(
  function AccordionPanel(props, ref) {
    const { className, children, ...rest } = props;
    return (
      <BaseAccordion.Panel ref={ref} className={panelStyles} {...rest}>
        <div className={cx(panelContentStyles, className)}>{children}</div>
      </BaseAccordion.Panel>
    );
  },
);
