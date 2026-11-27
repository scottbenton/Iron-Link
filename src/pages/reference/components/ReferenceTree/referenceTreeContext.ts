import { createContext, useContext } from "react";

import { VisibilitySettings } from "components/datasworn/_helpers/getCollectionVisibility";

export interface ReferenceTreeContextValue {
  // The item open beside the list. Its row is marked.
  selectedId: string | undefined;
  // The collections around the open item, which start open.
  openCollectionIds: Set<string>;
  // What the filter matched, while it holds any text.
  visibilitySettings: VisibilitySettings;
  // The filter's text, trimmed. Empty when nothing is filtered.
  search: string;
  // Rolls an oracle straight from its row. Lists without it offer no roll.
  rollOracle?: (oracleId: string) => void;
}

export const ReferenceTreeContext = createContext<ReferenceTreeContextValue>({
  selectedId: undefined,
  openCollectionIds: new Set(),
  visibilitySettings: { collectionVisibility: {}, itemVisibility: {} },
  search: "",
});

export function useReferenceTreeContext() {
  return useContext(ReferenceTreeContext);
}
