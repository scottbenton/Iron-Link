import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  ComponentProps,
  ElementType,
  ReactElement,
  ReactNode,
  forwardRef,
} from "react";

import { css, cva, cx } from "styled-system/css";

import { surfaceStyles } from "../Surface";

const cardStyles = cva({
  base: {
    position: "relative",
    display: "grid",
    alignContent: "start",
    gap: "3",
    minWidth: 0,
    fontFamily: "body",
    // A card with an action area is pressable: it gets the ledge, a border
    // that darkens on hover and the 1px sink on press, all as one piece.
    "&:has(> [data-card-action])": {
      boxShadow: "ledge",
      transform: "translateY(0)",
      transitionProperty: "transform, box-shadow, border-color",
      transitionDuration: "fast",
      transitionTimingFunction: "out",
    },
    "&:has(> [data-card-action]:hover)": {
      borderColor: "border.control",
      transform: "translateY(var(--spacing-lift))",
      boxShadow:
        "0 calc(var(--border-widths-ledge) - var(--spacing-lift)) 0 token(colors.border.edge)",
    },
    "&:has(> [data-card-action]:active)": {
      transform: "translateY(var(--spacing-sink))",
      boxShadow:
        "0 max(0px, calc(var(--border-widths-ledge) - var(--spacing-sink))) 0 token(colors.border.edge)",
      transitionDuration: "instant",
    },
    "&:has(> [data-card-action]:focus-visible)": {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "2px",
    },
    "&:has(> [data-card-action]:is(:disabled, [aria-disabled=true]))": {
      transform: "none",
      boxShadow: "none",
      borderColor: "border.default",
      opacity: 0.6,
    },
    "&[data-selected]": {
      borderColor: "border.control",
    },
  },
  variants: {
    padding: {
      none: { padding: 0 },
      sm: { padding: "3" },
      md: { padding: "4" },
      lg: { padding: "5" },
    },
  },
  defaultVariants: { padding: "md" },
});

export interface CardProps extends ComponentProps<"div"> {
  /** Inner padding; `none` for a card whose parts bring their own. */
  padding?: "none" | "sm" | "md" | "lg";
  /** Raise the card on a ledge without making it pressable. */
  raised?: boolean;
  /** Mark the chosen card in a set, such as the picked ruleset. */
  selected?: boolean;
  /** Render another element, such as `<article />` or `<li />`. */
  render?: ReactElement;
}

/**
 * A surface card: border, radius lg, the surface colour. Compose it from
 * `CardHeader`, `CardBody` and `CardFooter`. Put a `CardActionArea` inside
 * to make the whole card a button or link; it gets the ledge and sinks on
 * press, while buttons in a `CardFooter` stay separate controls.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card(props, ref) {
    const { padding, raised, selected, className, render, ...rest } = props;
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
          "data-selected": selected ? "" : undefined,
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
 * the control's name. Place it directly inside `Card`.
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
  fontWeight: "semibold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
});

const titleStyles = css({
  margin: 0,
  fontFamily: "heading",
  fontWeight: "semibold",
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
            zIndex: 1,
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
 * The card's actions and meta. Its buttons sit above a `CardActionArea`,
 * so they stay their own controls.
 */
export function CardFooter(props: CardFooterProps) {
  const { divider, className, ...rest } = props;
  return (
    <div
      className={cx(
        css({
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2",
          minWidth: 0,
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
