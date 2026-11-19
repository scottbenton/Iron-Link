import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { CaretRight } from "@phosphor-icons/react";
import {
  Children,
  ComponentProps,
  ReactElement,
  ReactNode,
  forwardRef,
  isValidElement,
} from "react";

import { focusRing } from "ui/styles/focus";
import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cx } from "styled-system/css";

const listStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "1",
  margin: 0,
  padding: 0,
  listStyle: "none",
  fontFamily: "body",
  fontSize: "sm",
  lineHeight: "snug",
  color: "fg.muted",
});

const itemStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  minWidth: 0,
});

const separatorStyles = css({
  display: "inline-flex",
  flex: "none",
  color: "fg.subtle",
  "& svg": { width: "12px", height: "12px" },
});

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
  "& svg": { flex: "none", width: "14px", height: "14px" },
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

export interface BreadcrumbsProps extends ComponentProps<"nav">, LayoutProps {
  /** Names the trail. */
  "aria-label"?: string;
  /** `BreadcrumbItem`s, from the top level to the current page. */
  children: ReactNode;
}

/**
 * Where a page sits: World, Locations, Bleakhold Station. Each item but the
 * last is a link; separators are drawn, not read.
 */
export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(
  function Breadcrumbs(props, ref) {
    const {
      "aria-label": ariaLabel = "Breadcrumb",
      children,
      className,
      ...rest
    } = withLayoutProps(props);
    const items = Children.toArray(children).filter(isValidElement);
    return (
      <nav ref={ref} aria-label={ariaLabel} className={className} {...rest}>
        <ol className={listStyles}>
          {items.map((item, index) => (
            <li key={item.key ?? index} className={itemStyles}>
              {index > 0 && (
                <span className={separatorStyles} aria-hidden>
                  <CaretRight weight="bold" />
                </span>
              )}
              {item}
            </li>
          ))}
        </ol>
      </nav>
    );
  },
);

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
