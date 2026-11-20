import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ComponentProps, ReactElement, ReactNode, forwardRef } from "react";

import { focusRing } from "ui/styles/focus";

import { css, cx } from "styled-system/css";

const crumbStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  maxWidth: "16rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  borderRadius: "xs",
  color: "fg.muted",
  textDecoration: "none",
  outline: "none",
  "& svg": { flex: "none", width: "icon.sm", height: "icon.sm" },
  "a&, button&": {
    cursor: "pointer",
    transition: "color token(durations.fast) linear",
    _hover: {
      color: "fg.default",
      textDecoration: "underline",
      textUnderlineOffset: "0.2em",
    },
    _focusVisible: focusRing.outset,
  },
  "&[aria-current=page]": { color: "fg.default", fontWeight: "semibold" },
});

export interface BreadcrumbItemProps extends Omit<ComponentProps<"a">, "ref"> {
  /** The page being shown: plain text with `aria-current="page"`. */
  current?: boolean;
  /** An icon before the label. */
  icon?: ReactNode;
  /** Render a router link: `render={<RouterLink to={path} />}`. */
  render?: ReactElement;
}

/** One step of the trail: a link, or the current page as text. */
export const BreadcrumbItem = forwardRef<HTMLElement, BreadcrumbItemProps>(
  function BreadcrumbItem(props, ref) {
    const { current, icon, render, className, children, href, ...rest } = props;
    const isLink = !current && (href !== undefined || render !== undefined);
    return useRender({
      defaultTagName: isLink ? "a" : "span",
      render: current ? undefined : render,
      ref,
      props: mergeProps<"a">(
        {
          className: cx(crumbStyles, className),
          "aria-current": current ? "page" : undefined,
          href: current ? undefined : href,
          children: (
            <>
              {icon}
              {children}
            </>
          ),
        },
        rest,
      ),
    });
  },
);
