import { ComponentProps } from "react";

import { css, cx } from "styled-system/css";

import { overlay } from "./cardSelectors";

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
