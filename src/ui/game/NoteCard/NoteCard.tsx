import { ReactNode, forwardRef } from "react";

import { css, cx } from "styled-system/css";

import { Card, CardLinkOverlay, CardProps } from "../../components/Card";
import type { CardLinkOverlayProps } from "../../components/Card";

const rowStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  minWidth: 0,
  minHeight: "32px",
  _touch: { minHeight: "touch" },
});

const iconStyles = css({
  flex: "none",
  display: "inline-grid",
  placeItems: "center",
  color: "fg.muted",
  fontSize: "20px",
});

const textStyles = css({
  display: "grid",
  gap: "0.5",
  flex: "1 1 auto",
  minWidth: 0,
});

const titleStyles = css({
  // Resets for a link rendered as a button, for a card that opens a dialog.
  margin: 0,
  padding: 0,
  border: 0,
  background: "transparent",
  textAlign: "start",
  fontWeight: "semibold",
  lineHeight: "snug",
  overflowWrap: "anywhere",
});

const subtitleStyles = css({
  fontSize: "sm",
  lineHeight: "snug",
  color: "fg.muted",
});

export interface NoteCardProps extends Omit<CardProps, "title" | "children"> {
  /** The item's kind, such as a folder or note icon. Decorative. */
  icon: ReactNode;
  /** The item's name; it is the link's whole name. */
  title: ReactNode;
  /** A line under the title, such as an entry count. */
  subtitle?: ReactNode;
  /**
   * The link that opens the item, laid over the whole card: an `href` and
   * click handlers, or `render={<button type="button" />}` for a card that
   * opens a dialog.
   */
  link: CardLinkOverlayProps;
  /** A control at the start, such as a drag handle. */
  start?: ReactNode;
  /** A control at the end, such as the item's menu. */
  action?: ReactNode;
}

/**
 * A compact card for one item in a Notes folder: a folder, a note, a world
 * category. The whole card opens it, and `start` and `action` keep their own
 * clicks. Lay a set out in a grid whose rows stretch, so cards with and
 * without a subtitle line up.
 */
export const NoteCard = forwardRef<HTMLDivElement, NoteCardProps>(
  function NoteCard(props, ref) {
    const { icon, title, subtitle, link, start, action, className, ...rest } =
      props;
    return (
      <Card
        ref={ref}
        padding="sm"
        className={cx(css({ alignContent: "center" }), className)}
        {...rest}
      >
        <div className={rowStyles}>
          {start}
          <span aria-hidden className={iconStyles}>
            {icon}
          </span>
          <span className={textStyles}>
            <CardLinkOverlay
              {...link}
              className={cx(titleStyles, link.className)}
            >
              {title}
            </CardLinkOverlay>
            {subtitle && <span className={subtitleStyles}>{subtitle}</span>}
          </span>
          {action}
        </div>
      </Card>
    );
  },
);
