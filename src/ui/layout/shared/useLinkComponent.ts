import { useContext } from "react";

import {
  LayoutLinkComponent,
  LinkComponentContext,
} from "./linkComponentContext";

/** The link component to render: the prop if given, else the provider's. */
export function useLinkComponent(
  override?: LayoutLinkComponent,
): LayoutLinkComponent {
  const fromContext = useContext(LinkComponentContext);
  return override ?? fromContext;
}
