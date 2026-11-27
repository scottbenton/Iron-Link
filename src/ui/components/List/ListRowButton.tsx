import { Button as BaseButton } from "@base-ui/react/button";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  ComponentProps,
  ComponentPropsWithoutRef,
  ReactElement,
  forwardRef,
} from "react";

import { cx } from "styled-system/css";

import { listRowStyles } from "./listRowStyles";

export interface ListRowButtonProps
  extends Omit<ComponentPropsWithoutRef<"button">, "ref"> {
  /**
   * Render a link instead, such as a reference page:
   * `render={<Link to={href} />}`.
   */
  render?: ReactElement;
  /**
   * The row is the current one: the open page for a link
   * (`aria-current="page"`), otherwise `aria-current="true"`.
   */
  current?: boolean;
}

/**
 * The pressable part of a `ListRow`. Put the name in a
 * `<span data-row-name>`, an icon before it in `data-row-icon` and a glyph
 * for what a press does (a chevron, a die) after it in `data-row-glyph`.
 * Disabled, it takes no pointer at all.
 */
export const ListRowButton = forwardRef<HTMLElement, ListRowButtonProps>(
  function ListRowButton(props, ref) {
    const { render, current, className, disabled, type, ...rest } = props;
    const isLink = render !== undefined;
    // A link stays a link: Base UI's button would give it role="button".
    const link = useRender({
      enabled: isLink,
      defaultTagName: "a",
      render,
      ref,
      props: mergeProps<"a">(
        {
          className: cx(listRowStyles, className),
          "aria-current": current ? "page" : undefined,
          "aria-disabled": disabled || undefined,
        },
        rest as ComponentProps<"a">,
      ),
    });
    if (link) return link;
    return (
      <BaseButton
        ref={ref}
        className={cx(listRowStyles, className)}
        disabled={disabled}
        type={type}
        aria-current={current ? "true" : undefined}
        {...rest}
      />
    );
  },
);
