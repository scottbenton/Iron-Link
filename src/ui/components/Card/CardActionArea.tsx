import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ComponentProps, ReactElement, forwardRef } from "react";

import { css, cx } from "styled-system/css";

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
