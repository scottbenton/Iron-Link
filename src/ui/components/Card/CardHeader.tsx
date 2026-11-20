import { ComponentProps, ElementType, ReactNode } from "react";

import { css, cx } from "styled-system/css";

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
