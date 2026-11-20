import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { ComponentProps, forwardRef } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { cva, cx } from "styled-system/css";

const rootStyles = cva({
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.5",
    boxSizing: "border-box",
    fontFamily: "body",
    "&[data-orientation=vertical]": {
      flexDirection: "column",
      alignItems: "stretch",
    },
  },
  variants: {
    variant: {
      /** A bar across the top of an editor: surface, padding, a hairline. */
      bar: {
        paddingBlock: "1.5",
        paddingInline: "2",
        background: "bg.surface",
        borderBottom: "1px solid token(colors.border.subtle)",
      },
      /** Just the controls, for a toolbar inside something else. */
      plain: {},
    },
  },
  defaultVariants: { variant: "bar" },
});

export interface ToolbarProps
  extends Omit<ComponentProps<typeof BaseToolbar.Root>, "className">,
    CssProp {
  /** Names the toolbar, such as "Formatting". */
  "aria-label": string;
  variant?: "bar" | "plain";
  className?: string;
}

/**
 * A row of controls with one Tab stop: arrow keys, Home and End move
 * between them (a roving tab index). Build it from `ToolbarButton`s,
 * `ToolbarGroup`s and `ToolbarSeparator`s, as in the rich text editor.
 */
export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(
  function Toolbar(props, ref) {
    const { variant, className, ...rest } = withCssProp(props);
    return (
      <BaseToolbar.Root
        ref={ref}
        className={cx(rootStyles({ variant }), className)}
        {...rest}
      />
    );
  },
);
