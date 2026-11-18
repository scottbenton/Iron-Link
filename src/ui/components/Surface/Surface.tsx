import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ComponentProps, ReactElement, forwardRef } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { cx } from "styled-system/css";

import { SurfaceVariants, surfaceStyles } from "./surfaceStyles";

export interface SurfaceProps
  extends ComponentProps<"div">,
    Pick<SurfaceVariants, "tone" | "radius" | "padding">,
    LayoutProps {
  /** Render another element, such as `<section />`. */
  render?: ReactElement;
}

/**
 * The library's `Paper`: a surface with a tone (flat, raised, inset or
 * canvas), a radius by nesting depth (controls md, cards lg, dialogs xl)
 * and optional padding.
 */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  function Surface(props, ref) {
    const { tone, radius, padding, className, render, ...rest } =
      withLayoutProps(props);
    return useRender({
      defaultTagName: "div",
      render,
      ref,
      props: mergeProps<"div">(
        { className: cx(surfaceStyles({ tone, radius, padding }), className) },
        rest,
      ),
    });
  },
);
