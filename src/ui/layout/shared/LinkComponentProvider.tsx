import { PropsWithChildren } from "react";

import {
  LayoutLinkComponent,
  LinkComponentContext,
} from "./linkComponentContext";

export interface LinkComponentProviderProps extends PropsWithChildren {
  /** Renders every link in the layout components, such as a router link. */
  linkComponent: LayoutLinkComponent;
}

/**
 * Sets the link component for the layout components below it, so the app
 * passes its router link once. A `linkComponent` prop on a component wins.
 */
export function LinkComponentProvider(props: LinkComponentProviderProps) {
  const { linkComponent, children } = props;
  return (
    <LinkComponentContext.Provider value={linkComponent}>
      {children}
    </LinkComponentContext.Provider>
  );
}
