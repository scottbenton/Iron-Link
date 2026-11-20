import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { CaretRight, LockSimple } from "@phosphor-icons/react";
import { ElementType, ReactNode, useId } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";
import { focusRing } from "ui/styles/focus";

import { css, cx } from "styled-system/css";

import { collapsiblePanelStyles } from "../../components/Collapsible/collapsibleStyles";

/**
 * Iron Link's secret style: a dashed border in the muted text colour over
 * the faint hover tint, so Guide-only content reads apart from the solid
 * panels and bands around it.
 */
const rootStyles = css({
  display: "grid",
  minWidth: 0,
  borderWidth: "1px",
  borderStyle: "dashed",
  borderColor: "fg.muted",
  borderRadius: "md",
  background: "overlay.hover",
  color: "fg.default",
  // The collapsible header reaches the edges; the clip keeps its hover and
  // focus inside the corners.
  overflow: "hidden",
});

const headerStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  // As tall as a small icon button, the tallest action it carries.
  minHeight: "control.sm",
  margin: 0,
  paddingInlineStart: "3",
  paddingInlineEnd: "1",
  color: "fg.muted",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  "& > svg, & [data-secret-icon] > svg": {
    flex: "none",
    width: "14px",
    height: "14px",
  },
});

const labelStyles = css({
  flex: "1 1 auto",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const triggerStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  flex: "1 1 auto",
  minWidth: 0,
  alignSelf: "stretch",
  margin: 0,
  marginInlineStart: "-3",
  paddingInlineStart: "3",
  paddingInlineEnd: "2",
  border: 0,
  background: "transparent",
  color: "inherit",
  font: "inherit",
  letterSpacing: "inherit",
  textTransform: "inherit",
  textAlign: "start",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  outline: "none",
  transition: "background-color token(durations.fast) linear",
  _hover: { background: "overlay.hover" },
  _focusVisible: focusRing.inset,
  _touch: { minHeight: "touch" },
  "& [data-caret]": {
    flex: "none",
    width: "14px",
    height: "14px",
    transition: "rotate token(durations.normal) token(easings.out)",
    _reducedMotion: { transition: "none" },
  },
  "&[data-panel-open] [data-caret]": { rotate: "90deg" },
});

const noteStyles = css({
  margin: 0,
  paddingInline: "3",
  fontSize: "xs",
  lineHeight: "normal",
  color: "fg.muted",
});

const bodyStyles = css({
  minWidth: 0,
  paddingInline: "3",
  // The header's own height already spaces the content from it; the
  // bottom matches the sides so the content sits evenly in the card.
  paddingBlockStart: 0,
  paddingBlockEnd: "3",
  "&[data-padding=none]": { padding: 0 },
});

export interface SecretCardProps extends CssProp {
  /** "Secret", "Guide only" or the group's name, in the header. */
  label: ReactNode;
  /** Before the label: a lock by default, `null` for none. */
  icon?: ReactNode;
  /** At the end of the header, such as a delete button. */
  action?: ReactNode;
  /** A line under the header, such as who it is shared with so far. */
  note?: ReactNode;
  children?: ReactNode;
  /**
   * A section named by its label, the default, for a secret in notes or a
   * group of fields. `false` makes it a plain box with its header hidden from
   * screen readers, where the content already says it is Guide only (a game
   * log entry's heading).
   */
  landmark?: boolean;
  /**
   * The header becomes a button that opens and closes the content, inside a
   * heading of this element when `headingAs` is given.
   */
  collapsible?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The heading element for a collapsible header, such as "h3". */
  headingAs?: ElementType;
  /** "none" for content that brings its own padding, such as a card. */
  padding?: "default" | "none";
  className?: string;
}

/**
 * Guide-only content: a secret block in notes, a Guide only group of world
 * entry fields, a Guide only message or roll in the game log (a roll fills
 * it, with `padding="none"`). A dashed card with a
 * lock and a label, an optional note, then the content. It can open and
 * close from its header.
 */
export function SecretCard(props: SecretCardProps) {
  const {
    label,
    icon,
    action,
    note,
    children,
    landmark = true,
    collapsible,
    defaultOpen = true,
    open,
    onOpenChange,
    headingAs,
    padding = "default",
    className,
  } = withCssProp<SecretCardProps>(props);
  const labelId = useId();
  const iconNode =
    icon === undefined ? <LockSimple weight="bold" aria-hidden /> : icon;

  const body = (
    <>
      {note && <p className={noteStyles}>{note}</p>}
      {children !== undefined && (
        <div className={bodyStyles} data-padding={padding}>
          {children}
        </div>
      )}
    </>
  );

  if (collapsible) {
    const Heading = headingAs ?? "div";
    return (
      <BaseCollapsible.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        render={landmark ? <section aria-labelledby={labelId} /> : <div />}
        className={cx(rootStyles, className)}
      >
        <Heading className={headerStyles}>
          <BaseCollapsible.Trigger className={triggerStyles}>
            {iconNode && <span data-secret-icon="">{iconNode}</span>}
            <span id={labelId} className={labelStyles}>
              {label}
            </span>
            <CaretRight data-caret="" weight="bold" aria-hidden />
          </BaseCollapsible.Trigger>
          {action}
        </Heading>
        <BaseCollapsible.Panel className={collapsiblePanelStyles}>
          {body}
        </BaseCollapsible.Panel>
      </BaseCollapsible.Root>
    );
  }

  const Root = landmark ? "section" : "div";
  return (
    <Root
      className={cx(rootStyles, className)}
      aria-labelledby={landmark ? labelId : undefined}
    >
      <div className={headerStyles}>
        {iconNode}
        <span
          id={labelId}
          className={labelStyles}
          aria-hidden={landmark ? undefined : true}
        >
          {label}
        </span>
        {action}
      </div>
      {body}
    </Root>
  );
}
