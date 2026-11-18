import { Button as BaseButton } from "@base-ui/react/button";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  ComponentProps,
  ElementType,
  ReactElement,
  ReactNode,
  forwardRef,
} from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cva, cx } from "styled-system/css";
import type { SystemStyleObject } from "styled-system/types";

import { type ButtonProps, buttonStyles } from "../Button";
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
    // The shadow is two parts, so hover, press and selection each change
    // only their own: the selection ring and the ledge's height.
    "--card-ring": "0 0 #0000",
    "--card-ledge": "0px",
    // A card with an action area or an overlay is pressable: it gets the
    // ledge, a border that darkens on hover and the 1px sink on press, all as
    // one piece. Hovering or pressing a secondary action inside does neither.
    [`&:has(${target("")})`]: {
      "--card-ledge": "var(--border-widths-ledge)",
      boxShadow:
        "var(--card-ring), 0 var(--card-ledge) 0 token(colors.border.edge)",
      transform: "translateY(0)",
      transitionProperty: "transform, box-shadow, border-color",
      transitionDuration: "fast",
      transitionTimingFunction: "out",
    },
    // Not while pressed: the press rule below sets the same two, and the two
    // selectors weigh the same, so stylesheet order would pick.
    [`&:has(${target(`:is(:hover, [data-hover]):not(:active, [data-pressed])${enabled}`)})`]:
      {
        "--card-ledge":
          "calc(var(--border-widths-ledge) - var(--spacing-lift))",
        transform: "translateY(var(--spacing-lift))",
      },
    // Not on a selected card, whose accent border must show while the
    // pointer is still on it.
    [`&:not([data-selected]):has(${target(`:is(:hover, [data-hover])${enabled}`)})`]:
      {
        borderColor: "border.control",
      },
    [`&:has(${target(`:is(:active, [data-pressed])${enabled}`)})`]: {
      "--card-ledge":
        "max(0px, calc(var(--border-widths-ledge) - var(--spacing-sink)))",
      transform: "translateY(var(--spacing-sink))",
      transitionDuration: "instant",
    },
    [`&:has(${target(":focus-visible")})`]: {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "2px",
    },
    // Chosen, as one of a set: an accent border doubled by an inset ring.
    // Hover and press change the ledge only, so the ring stays put.
    "&[data-selected]": {
      borderColor: "accent.solid",
      "--card-ring": "inset 0 0 0 1px token(colors.accent.solid)",
      boxShadow:
        "var(--card-ring), 0 var(--card-ledge) 0 token(colors.border.edge)",
    },
    [`&:has(${target(":is(:disabled, [aria-disabled=true], [data-disabled])")})`]:
      {
        transform: "none",
        boxShadow: "none",
        borderColor: "border.default",
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
  /**
   * Shows the card as chosen: an accent border and ring. Pair it with a
   * `CardButtonOverlay` whose `pressed` says the same to assistive tech.
   */
  selected?: boolean;
  /** Render another element, such as `<article />` or `<li />`. */
  render?: ReactElement;
}

/**
 * A surface card: border, radius lg, the surface colour. Compose it from
 * `CardHeader`, `CardBody` and `CardFooter`.
 *
 * To make the whole card open or do something, use one of three parts:
 * - `CardLinkOverlay` when the card opens a page and holds other controls
 *   (a menu, an Invite button) anywhere in it. The link is just the title,
 *   so its name is short, and the other controls keep working.
 * - `CardButtonOverlay` when the card does something (Select) and should
 *   say so with a visible button: the button's hit area covers the card,
 *   and the other controls keep working. With `selected` on the card and
 *   `pressed` on the button it picks one of several.
 * - `CardActionArea` when the card is one control whose name is everything
 *   it wraps, such as a button that runs an action. Other controls go in a
 *   `CardFooter` or the header's `action`, outside it.
 *
 * Each gives the card the ledge and the 1px sink on press. To choose
 * exactly one of a set, use `RadioCard` instead.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card(props, ref) {
    const { padding, raised, selected, className, render, ...rest } =
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
          "data-selected": selected || undefined,
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

/**
 * The button's look stays; its own position and movement go, because a
 * positioned or transformed button would hold its stretched hit area to its
 * own box. The card sinks on press and draws the focus ring instead. The
 * `:is()` raises these above the button recipe's hover, press and focus.
 */
const buttonOverlayStyles = css({
  "&[data-card-overlay]:is(*, :hover, :active, [data-pressed], :focus-visible)":
    {
      position: "static",
      transform: "none",
      outline: "none",
    },
  // Stretched over the whole card, border included.
  _before: {
    content: '""',
    position: "absolute",
    zIndex: 1,
    inset: "-1px",
    borderRadius: "lg",
  },
});

export interface CardButtonOverlayProps
  extends Omit<ComponentProps<typeof BaseButton>, "className" | "render"> {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  /** An icon before the label. */
  startIcon?: ReactNode;
  /** An icon after the label. */
  endIcon?: ReactNode;
  /**
   * For a card picked from several: on, off, or `undefined` for a plain
   * button that runs its action once (pick one and close the dialog).
   * Exposed as `aria-pressed`, so the name stays the same either way.
   */
  pressed?: boolean;
  /** Render as a router link, with `nativeButton={false}`. */
  render?: ReactElement;
  className?: string;
}

/**
 * A visible button, such as Select, whose hit area covers the whole card,
 * so a click anywhere on the card presses it. Name it for the card, not just
 * the verb: give `aria-label="Select Ironclad"` (the visible label must stay
 * part of the name). Place it anywhere in the card except inside another
 * positioned element; a `CardFooter` is fine.
 *
 * Other controls in the card (a rules toggle, links in rules text) sit
 * above it and keep their own clicks, as with `CardLinkOverlay`. Text under
 * it presses the button rather than starting a selection.
 */
export const CardButtonOverlay = forwardRef<
  HTMLButtonElement,
  CardButtonOverlayProps
>(function CardButtonOverlay(props, ref) {
  const {
    variant,
    size = "sm",
    startIcon,
    endIcon,
    pressed,
    render,
    nativeButton,
    className,
    children,
    ...rest
  } = props;
  return (
    <BaseButton
      ref={ref}
      render={render}
      nativeButton={nativeButton ?? !render}
      className={cx(
        buttonStyles({ variant, size }),
        buttonOverlayStyles,
        className,
      )}
      aria-pressed={pressed}
      data-card-overlay=""
      {...rest}
    >
      {startIcon}
      {children}
      {endIcon}
    </BaseButton>
  );
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
