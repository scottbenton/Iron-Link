import { Datasworn } from "@datasworn-community/core";
import { ReactNode, createContext, useContext } from "react";

import { VisibilitySettings } from "components/datasworn/_helpers/getCollectionVisibility";

export interface DataswornTreeRowState {
  // The row is the item open beside the list.
  current: boolean;
}

export interface DataswornOracleRowItem {
  id: string;
  name: string;
  // A single table rolls from its row; a shared-text table opens to roll.
  canRoll: boolean;
  // Read under the name, such as the fields that roll a featured oracle.
  description?: string;
}

export type RenderMoveRow = (
  move: Datasworn.Move,
  state: DataswornTreeRowState,
) => ReactNode;

export type RenderOracleRow = (
  oracle: DataswornOracleRowItem,
  state: DataswornTreeRowState,
) => ReactNode;

export interface DataswornTreeContextValue {
  // The item open beside the list. Its row is marked.
  selectedId: string | undefined;
  // The collections around the open item, which start open.
  openCollectionIds: Set<string>;
  // What the filter matched, while it holds any text.
  visibilitySettings: VisibilitySettings;
  // The filter's text, trimmed. Empty when nothing is filtered.
  search: string;
}

export const DataswornTreeContext = createContext<DataswornTreeContextValue>({
  selectedId: undefined,
  openCollectionIds: new Set(),
  visibilitySettings: { collectionVisibility: {}, itemVisibility: {} },
  search: "",
});

export function useDataswornTreeContext() {
  return useContext(DataswornTreeContext);
}
