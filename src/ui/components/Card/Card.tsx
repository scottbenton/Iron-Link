import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  ComponentProps,
  ElementType,
  ReactElement,
  ReactNode,
  forwardRef,
} from "react";

import { focusRing } from "ui/styles/focus";
import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";
import { ledgeHeight, ledgeLayers } from "ui/styles/ledge";

import { css, cva, cx } from "styled-system/css";
import type { SystemStyleObject } from "styled-system/types";

import { surfaceStyles } from "../Surface";

/** A press target inside the card: an action area, or an overlay. */
const action = "> [data-card-action]";
const overlay = "[data-card-overlay]";
/** Either target, in a state, for use inside `:has()`. */
const target = (state: string) => `${action}${state}, ${overlay}${state}`;
const enabled = ":not(:disabled, [aria-disabled=true], [data-disabled])";

/**
 * With an overlay, every other control in the card sits above the overlay
 * (z-index 1) so it stays its own target, as does anything marked
 * `data-card-raised`. Zero specificity, so a control's own positioning still
 * wins. Panda's types only take selectors that start or end with `&`.
 */
const raisedControls = {
  [`:where(&:has(${overlay})) :where(a[href], button, input, select, textarea, summary, label, [role=button], [role=link], [role=checkbox], [role=switch], [role=tab], [tabindex]:not([tabindex="-1"]), [data-card-raised]):where(:not(${overlay}))`]:
    { position: "relative", zIndex: 2 },
} as SystemStyleObject;

const cardStyles = cva({
  base: {
    position: "relative",
    display: "grid",
    alignContent: "start",
    gap: "3",
    minWidth: 0,
    fontFamily: "body",
    // The face and ledge colours, drawn only once the card is pressable.
    "--ledge-face": "{colors.bg.surface}",
    "--ledge-border": "{colors.border.default}",
    "--ledge-edge": "{colors.border.edge}",
    // A card with an action area or an overlay is pressable: its face and
    // ledge become layers under its content (see `ledgeLayers`), the border
    // darkens on hover and it sinks on press, all as one piece. Hovering or
    // pressing a secondary action inside does neither.
    [`&:has(${target("")})`]: {
      ...ledgeLayers("token(radii.lg)"),
      boxShadow: "none",
      transform: "translateY(0)",
      transitionProperty: "transform",
      transitionDuration: "fast",
      transitionTimingFunction: "out",
    },
    // Not while pressed: the press rule below sets the same two, and the two
    // selectors weigh the same, so stylesheet order would pick.
    [`&:has(${target(`:is(:hover, [data-hover]):not(:active, [data-pressed])${enabled}`)})`]:
      {
        "--ledge-height": ledgeHeight.lifted,
        transform: "translateY(var(--spacing-lift))",
      },
    [`&:has(${target(`:is(:hover, [data-hover])${enabled}`)})`]: {
      "--ledge-border": "{colors.border.control}",
    },
    [`&:has(${target(`:is(:active, [data-pressed])${enabled}`)})`]: {
      "--ledge-height": ledgeHeight.sunk,
      transform: "translateY(var(--spacing-sink))",
      transitionDuration: "instant",
    },
    [`&:has(${target(":focus-visible")})`]: focusRing.outset,
    [`&:has(${target(":is(:disabled, [aria-disabled=true], [data-disabled])")})`]:
      {
        transform: "none",
        "--ledge-height": ledgeHeight.rest,
        "--ledge-border": "{colors.border.default}",
        "--ledge-inset": "none",
        "--ledge-edge": "transparent",
        opacity: 0.6,
      },
    ...raisedControls,
  },
  variants: {
    padding: {
      none: { padding: 0 },
      sm: { padding: "3" },
      md: { padding: "4" },
    },
  },
  defaultVariants: { padding: "md" },
});

export interface CardProps extends ComponentProps<"div">, LayoutProps {
  /** Inner padding; `none` for a card whose parts bring their own. */
  padding?: "none" | "sm" | "md";
  /** Raise the card on a ledge without making it pressable. */
  raised?: boolean;
  /** Render another element, such as `<article />` or `<li />`. */
  render?: ReactElement;
}

/**
 * A surface card: border, radius lg, the surface colour. Compose it from
 * `CardHeader`, `CardBody` and `CardFooter`.
 *
 * To make the whole card open or do something, use one of two parts:
 * - `CardLinkOverlay` when the card opens a page and holds other controls
 *   (a menu, an Invite button) anywhere in it. The link is just the title,
 *   so its name is short, and the other controls keep working.
 * - `CardActionArea` when the card is one control whose name is everything
 *   it wraps, such as a button that runs an action. Other controls go in a
 *   `CardFooter` or the header's `action`, outside it.
 *
 * Each gives the card the ledge and the 1px sink on press. To choose one
 * of a set, use `RadioCard` (or a `Checkbox` in each card for several).
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card(props, ref) {
    const { padding, raised, className, render, ...rest } =
      withLayoutProps(props);
    return useRender({
      defaultTagName: "div",
      render,
      ref,
      props: mergeProps<"div">(
        {
          className: cx(
            surfaceStyles({ tone: raised ? "raised" : "flat", radius: "lg" }),
            cardStyles({ padding }),
            className,
          ),
        } as ComponentProps<"div">,
        rest,
      ),
    });
  },
);

const actionAreaStyles = css({
  display: "grid",
  alignContent: "start",
  gap: "inherit",
  boxSizing: "border-box",
  width: "100%",
  margin: 0,
  padding: 0,
  border: 0,
  background: "transparent",
  color: "inherit",
  font: "inherit",
  textAlign: "start",
  textDecoration: "none",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  outline: "none",
  // The whole card is the target, padding included.
  _after: {
    content: '""',
    position: "absolute",
    inset: "-1px",
    borderRadius: "lg",
  },
  "&:is(:disabled, [aria-disabled=true])": { cursor: "not-allowed" },
});

export interface CardActionAreaProps
  extends Omit<ComponentProps<"button">, "ref"> {
  /** Render a link: `render={<RouterLink to={path} />}`. */
  render?: ReactElement;
}

/**
 * Makes the whole card a button, or a link through `render`. Wrap the
 * content that names the action (usually the header and body); its text is
 * the control's name. Place it directly inside `Card`. Nothing interactive
 * may sit inside it; for a card with other controls among its content, or a
 * link that should be named by the title alone, use `CardLinkOverlay`.
 */
export const CardActionArea = forwardRef<HTMLElement, CardActionAreaProps>(
  function CardActionArea(props, ref) {
    const { render, className, type, disabled, ...rest } = props;
    return useRender({
      defaultTagName: "button",
      render,
      ref,
      props: mergeProps<"button">(
        {
          className: cx(actionAreaStyles, className),
          ...(render
            ? { "aria-disabled": disabled || undefined }
            : { type: type ?? "button", disabled }),
        },
        { "data-card-action": "" } as ComponentProps<"button">,
        rest,
      ),
    });
  },
);

const linkOverlayStyles = css({
  color: "inherit",
  font: "inherit",
  textDecoration: "none",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  outline: "none",
  // The card draws the focus ring; the link underlines on hover.
  _hover: {
    textDecorationLine: "underline",
    textDecorationThickness: "1px",
    textUnderlineOffset: "0.2em",
  },
  // Stretched over the whole card, border included. The link itself must not
  // be positioned, nor anything between it and the card.
  _before: {
    content: '""',
    position: "absolute",
    zIndex: 1,
    inset: "-1px",
    borderRadius: "lg",
  },
});

export interface CardLinkOverlayProps extends Omit<ComponentProps<"a">, "ref"> {
  /** Render a router link: `render={<RouterLink to={path} />}`. */
  render?: ReactElement;
}

/**
 * A link whose hit area covers the whole card, so a click anywhere on the
 * card follows it (Chakra's LinkOverlay, Bootstrap's stretched link). Wrap
 * the text that names the card, usually the title:
 * `<CardHeader title={<CardLinkOverlay href={path}>{name}</CardLinkOverlay>} />`.
 * Its name is that text alone.
 *
 * Other controls in the card (buttons, menus, links, fields) sit above the
 * overlay and keep their own clicks. Text under the overlay opens the link
 * rather than starting a selection; mark a block `data-card-raised` to keep
 * its text selectable (it then stops opening the link). A wrapper that
 * creates a stacking context (`isolation`, `z-index`, `opacity`) around a
 * control puts the control under the overlay; mark that wrapper
 * `data-card-raised` too.
 */
export const CardLinkOverlay = forwardRef<
  HTMLAnchorElement,
  CardLinkOverlayProps
>(function CardLinkOverlay(props, ref) {
  const { render, className, ...rest } = props;
  return useRender({
    defaultTagName: "a",
    render,
    ref,
    props: mergeProps<"a">(
      {
        className: cx(linkOverlayStyles, className),
        "data-card-link": "",
        "data-card-overlay": "",
      } as ComponentProps<"a">,
      rest,
    ),
  });
});

const headerStyles = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "3",
  minWidth: 0,
});

const headerTextStyles = css({
  display: "grid",
  gap: "0.5",
  flex: "1 1 auto",
  minWidth: 0,
});

const overlineStyles = css({
  margin: 0,
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
});

const titleStyles = css({
  margin: 0,
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xl",
  lineHeight: "tight",
  textWrap: "balance",
  overflowWrap: "anywhere",
});

const subtitleStyles = css({
  margin: 0,
  fontSize: "sm",
  lineHeight: "snug",
  color: "fg.muted",
});

export interface CardHeaderProps extends Omit<ComponentProps<"div">, "title"> {
  /** The card's title. */
  title: ReactNode;
  /**
   * The title's element. Headings nest by section; use a `span` for a
   * title that only looks like a heading (CLAUDE.md).
   */
  titleAs?: ElementType;
  /** Small uppercase text above the title, such as a rank. */
  overline?: ReactNode;
  /** A line under the title, such as a ruleset or a player. */
  subtitle?: ReactNode;
  /** An avatar or icon before the title. */
  avatar?: ReactNode;
  /** Buttons at the end, such as a menu. Outside any action area. */
  action?: ReactNode;
}

/** The card's title row: avatar, overline, title, subtitle and actions. */
export function CardHeader(props: CardHeaderProps) {
  const {
    title,
    titleAs: Title = "h3",
    overline,
    subtitle,
    avatar,
    action,
    className,
    ...rest
  } = props;
  return (
    <div className={cx(headerStyles, className)} {...rest}>
      {avatar && (
        <span className={css({ flex: "none", display: "inline-flex" })}>
          {avatar}
        </span>
      )}
      <div className={headerTextStyles}>
        {overline && <span className={overlineStyles}>{overline}</span>}
        <Title className={titleStyles}>{title}</Title>
        {subtitle && <span className={subtitleStyles}>{subtitle}</span>}
      </div>
      {action && (
        <div
          className={css({
            position: "relative",
            zIndex: 2,
            flex: "none",
            display: "flex",
            gap: "1",
            marginBlock: "-1",
          })}
        >
          {action}
        </div>
      )}
    </div>
  );
}

/** The card's main content. */
export function CardBody(props: ComponentProps<"div">) {
  const { className, ...rest } = props;
  return (
    <div
      className={cx(
        css({
          display: "grid",
          gap: "3",
          minWidth: 0,
          fontSize: "sm",
          lineHeight: "normal",
        }),
        className,
      )}
      {...rest}
    />
  );
}

export interface CardFooterProps extends ComponentProps<"div"> {
  /** A hairline above the footer. */
  divider?: boolean;
}

/**
 * The card's actions and meta. Its buttons sit above a `CardActionArea` or
 * a `CardLinkOverlay`, so they stay their own controls.
 */
export function CardFooter(props: CardFooterProps) {
  const { divider, className, ...rest } = props;
  return (
    <div
      className={cx(
        css({
          // Above a CardActionArea by order. Under a CardLinkOverlay, so the
          // footer's text opens the link; its controls are raised by Card.
          position: "relative",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2",
          minWidth: 0,
          // A button overlay here must stretch over the card, not the footer.
          [`&:has(${overlay})`]: { position: "static" },
        }),
        divider &&
          css({
            borderTop: "1px solid token(colors.border.subtle)",
            paddingTop: "3",
          }),
        className,
      )}
      {...rest}
    />
  );
}
