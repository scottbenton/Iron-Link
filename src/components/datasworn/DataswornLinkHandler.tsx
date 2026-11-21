import { PropsWithChildren } from "react";

import { DataswornRulesTextProvider } from "./DataswornRulesTextProvider";
import {
  DataswornLinkHandler,
  DataswornLinkHandlerContext,
} from "./useDataswornLinkHandler";

export interface DataswornLinkHandlerProviderProps extends PropsWithChildren {
  onOpen: DataswornLinkHandler;
}

// Lets a page decide what a Datasworn link in rules text opens. Without a
// provider, links open the Datasworn dialog. The rules text inside reads the
// new handler through its own DataswornRulesTextProvider.
export function DataswornLinkHandlerProvider(
  props: DataswornLinkHandlerProviderProps,
) {
  const { onOpen, children } = props;
  return (
    <DataswornLinkHandlerContext.Provider value={onOpen}>
      <DataswornRulesTextProvider>{children}</DataswornRulesTextProvider>
    </DataswornLinkHandlerContext.Provider>
  );
}
