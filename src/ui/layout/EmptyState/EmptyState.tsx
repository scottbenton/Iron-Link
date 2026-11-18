import { ElementType, ReactNode } from "react";

import { css, cva, cx } from "styled-system/css";

const rootStyles = cva({
  base: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "2",
    marginInline: "auto",
    width: "100%",
    color: "fg.default",
    fontFamily: "body",
  },
  variants: {
    size: {
      sm: { paddingBlock: "6", paddingInline: "4", maxWidth: "360px" },
      md: { paddingBlock: "12", paddingInline: "6", maxWidth: "480px" },
    },
  },
  defaultVariants: { size: "md" },
});

const iconStyles = cva({
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "none",
    marginBlockEnd: "2",
    borderRadius: "full",
    background: "bg.emphasized",
    color: "fg.muted",
  },
  variants: {
    size: {
      sm: {
        width: "48px",
        height: "48px",
        "& svg": { width: "24px", height: "24px" },
      },
      md: {
        width: "64px",
        height: "64px",
        "& svg": { width: "32px", height: "32px" },
      },
    },
  },
  defaultVariants: { size: "md" },
});

const titleStyles = cva({
  base: {
    margin: 0,
    fontFamily: "heading",
    fontWeight: "bold",
    lineHeight: "tight",
    textWrap: "balance",
  },
  variants: {
    size: { sm: { fontSize: "lg" }, md: { fontSize: "xl" } },
  },
  defaultVariants: { size: "md" },
});

const messageStyles = css({
  margin: 0,
  maxWidth: "48ch",
  color: "fg.muted",
  fontSize: "sm",
  lineHeight: "normal",
  textWrap: "pretty",
});

const actionsStyles = css({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "2",
  marginBlockStart: "3",
});

export interface EmptyStateProps {
  /** A Phosphor icon in a round well, decorative. */
  icon?: ReactNode;
  title?: ReactNode;
  /**
   * The title's element. It looks like a heading but is a status line
   * (`p`) unless it is the page's own heading, such as a 404 page's h1.
   */
  titleAs?: ElementType;
  message?: ReactNode;
  /** The main way forward, usually a primary Button. */
  action?: ReactNode;
  /** A second, quieter action beside it. */
  secondaryAction?: ReactNode;
  size?: "sm" | "md";
  className?: string;
}

/**
 * What a place shows when it holds nothing yet, or failed to load: an
 * icon, a title, a line of explanation and the action that fills it. It
 * sits straight on the page, with no card or border around it.
 */
export function EmptyState(props: EmptyStateProps) {
  const {
    icon,
    title,
    titleAs: Title = "p",
    message,
    action,
    secondaryAction,
    size,
    className,
  } = props;

  return (
    <div className={cx(rootStyles({ size }), className)}>
      {icon && (
        <span className={iconStyles({ size })} aria-hidden="true">
          {icon}
        </span>
      )}
      {title && <Title className={titleStyles({ size })}>{title}</Title>}
      {message &&
        (typeof message === "string" ? (
          <p className={messageStyles}>{message}</p>
        ) : (
          <div className={messageStyles}>{message}</div>
        ))}
      {(action || secondaryAction) && (
        <div className={actionsStyles}>
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
