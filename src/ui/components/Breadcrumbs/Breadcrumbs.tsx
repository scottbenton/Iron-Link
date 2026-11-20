import { CaretRight } from "@phosphor-icons/react";
import {
  Children,
  ComponentProps,
  ReactNode,
  forwardRef,
  isValidElement,
} from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css } from "styled-system/css";

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

export interface BreadcrumbsProps extends ComponentProps<"nav">, CssProp {
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
    } = withCssProp(props);
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
