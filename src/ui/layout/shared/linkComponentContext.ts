import {
  AnchorHTMLAttributes,
  ElementType,
  ReactNode,
  createContext,
} from "react";

/**
 * What a link component receives: an anchor's props with `href`. The app's
 * `LinkComponent` (react-router's Link taking `href`) fits as it is.
 */
export type LayoutLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
};

export type LayoutLinkComponent = ElementType<LayoutLinkProps>;

export const LinkComponentContext = createContext<LayoutLinkComponent>("a");
