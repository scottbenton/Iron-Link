import {
  AnchorHTMLAttributes,
  ElementType,
  ReactNode,
  createContext,
  useContext,
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

/** The link component to render: the prop if given, else the provider's. */
export function useLinkComponent(
  override?: LayoutLinkComponent,
): LayoutLinkComponent {
  const fromContext = useContext(LinkComponentContext);
  return override ?? fromContext;
}
