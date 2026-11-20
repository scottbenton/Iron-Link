import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ComponentProps, ReactElement, forwardRef, useContext } from "react";

import { focusRing } from "ui/styles/focus";
import {
  disabledSelector,
  quietPressable,
  selectedSelector,
} from "ui/styles/pressable";

import { cva, cx } from "styled-system/css";

import { ListContext } from "./listContext";

const buttonStyles = cva({
  base: {
    ...quietPressable,
    flex: "1 1 auto",
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "3",
    width: "100%",
    color: "fg.default",
    font: "inherit",
    fontFamily: "body",
    textAlign: "start",
    userSelect: "none",
    // Rows have no ledge, so they answer a press with colour, not travel.
    [selectedSelector]: {
      background: "overlay.selected",
      fontWeight: "semibold",
      "& [data-list-icon]": { color: "fg.default" },
    },
    _focusVisible: focusRing.inset,
    [disabledSelector]: {
      cursor: "not-allowed",
      color: "fg.disabled",
      background: "transparent",
      "& [data-list-icon], & [data-list-secondary]": { color: "fg.disabled" },
    },
  },
  variants: {
    dense: {
      true: {
        minHeight: "control.row",
        paddingBlock: "1.5",
        paddingInline: "3",
      },
      false: { minHeight: "touch", paddingBlock: "2", paddingInline: "4" },
    },
    inset: {
      true: { borderRadius: "md" },
      false: {},
    },
  },
  compoundVariants: [
    { inset: true, css: { paddingInline: "3" } },
    { dense: true, css: { _touch: { minHeight: "touch" } } },
  ],
});

export interface ListItemButtonProps
  extends Omit<ComponentProps<"button">, "ref"> {
  /**
   * The row is the current one, such as the open game or the chosen
   * oracle. Shown as a neutral overlay. Pair it with the right state for
   * the row: `aria-current="page"` on a link, `aria-pressed` on a toggle.
   */
  selected?: boolean;
  /**
   * Render a link: `render={<RouterLink to={path} />}`. Links keep their
   * own semantics; disabled does not apply to them.
   */
  render?: ReactElement;
}

/** The interactive part of a row: a button, or a link through `render`. */
export const ListItemButton = forwardRef<HTMLElement, ListItemButtonProps>(
  function ListItemButton(props, ref) {
    const { selected, render, className, disabled, type, ...rest } = props;
    const { dense, inset } = useContext(ListContext);
    return useRender({
      defaultTagName: "button",
      render,
      ref,
      props: mergeProps<"button">(
        {
          className: cx(buttonStyles({ dense, inset }), className),
          // Only a real button takes type and disabled.
          ...(render
            ? { "aria-disabled": disabled || undefined }
            : { type: type ?? "button", disabled }),
        },
        {
          "data-list-button": "",
          "data-selected": selected ? "" : undefined,
        } as ComponentProps<"button">,
        rest,
      ),
    });
  },
);
