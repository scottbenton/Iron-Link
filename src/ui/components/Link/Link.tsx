import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ArrowUpRight } from "@phosphor-icons/react";
import { ComponentProps, ReactElement, forwardRef } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { cva, cx } from "styled-system/css";

import { VisuallyHidden } from "../VisuallyHidden";

const linkStyles = cva({
  base: {
    display: "inline",
    color: "var(--link-color)",
    fontWeight: "inherit",
    textDecorationLine: "underline",
    textDecorationThickness: "1px",
    textUnderlineOffset: "0.2em",
    textDecorationColor:
      "color-mix(in oklab, var(--link-color) 45%, transparent)",
    borderRadius: "xs",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    transition:
      "text-decoration-color token(durations.fast) linear, color token(durations.fast) linear",
    outline: "none",
    _hover: {
      textDecorationColor: "var(--link-color)",
      textDecorationThickness: "2px",
    },
    _focusVisible: {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "2px",
      textDecorationColor: "var(--link-color)",
    },
    "& svg": {
      display: "inline",
      width: "0.9em",
      height: "0.9em",
      marginInlineStart: "0.1em",
      verticalAlign: "-0.05em",
    },
  },
  variants: {
    color: {
      accent: { "--link-color": "{colors.accent.fg}" },
      default: { "--link-color": "{colors.fg.default}" },
      muted: { "--link-color": "{colors.fg.muted}" },
      inherit: { "--link-color": "currentColor" },
    },
    underline: {
      /** Underlined at rest; links in running text. */
      always: {},
      /** Underlined on hover and focus; links in lists and headers. */
      hover: {
        textDecorationColor: "transparent",
      },
    },
  },
  defaultVariants: { color: "accent", underline: "always" },
});

export interface LinkProps
  extends Omit<ComponentProps<"a">, "color" | "ref">,
    LayoutProps {
  color?: "accent" | "default" | "muted" | "inherit";
  underline?: "always" | "hover";
  /**
   * Opens in a new tab, with an arrow and a hidden note saying so. Uses
   * `externalLabel` for the note.
   */
  external?: boolean;
  /** Read after an external link's text. */
  externalLabel?: string;
  /** Render a router link: `render={<RouterLink to={path} />}`. */
  render?: ReactElement;
}

/** A text link in the accent colour with an offset underline. */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  function Link(props, ref) {
    const {
      color,
      underline,
      external,
      externalLabel = "(opens in a new tab)",
      render,
      className,
      children,
      ...rest
    } = withLayoutProps(props);
    return useRender({
      defaultTagName: "a",
      render,
      ref,
      props: mergeProps<"a">(
        {
          className: cx(linkStyles({ color, underline }), className),
          ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
          children: external ? (
            <>
              {children}
              <ArrowUpRight weight="bold" aria-hidden />
              <VisuallyHidden> {externalLabel}</VisuallyHidden>
            </>
          ) : (
            children
          ),
        },
        rest,
      ),
    });
  },
);
