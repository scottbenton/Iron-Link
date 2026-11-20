import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ComponentProps, ReactElement, forwardRef } from "react";

import { css, cx } from "styled-system/css";

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
