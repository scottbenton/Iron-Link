import {
  AnchorHTMLAttributes,
  ForwardedRef,
  MouseEventHandler,
  PropsWithChildren,
  forwardRef,
} from "react";
import { Link } from "react-router";

export interface NavigationLinkProps {
  href: string;
  onClick?: MouseEventHandler<HTMLElement>;
  onAuxClick?: MouseEventHandler<HTMLElement>;
  onMouseDown?: MouseEventHandler<HTMLElement>;
}

export const NewLink = (
  props: PropsWithChildren<
    AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
  >,
  ref: ForwardedRef<HTMLAnchorElement>,
) => {
  const { href, ...rest } = props;
  return <Link ref={ref} to={href} {...rest} />;
};

export const LinkComponent = forwardRef<
  HTMLAnchorElement,
  PropsWithChildren<AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>
>(NewLink);
