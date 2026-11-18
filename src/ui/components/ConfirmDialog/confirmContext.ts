import { createContext } from "react";

import type { ConfirmOptions } from "./ConfirmDialog";

export interface ConfirmResult {
  confirmed: boolean;
}

export type Confirm = (options?: ConfirmOptions) => Promise<ConfirmResult>;

export const ConfirmContext = createContext<Confirm | null>(null);
