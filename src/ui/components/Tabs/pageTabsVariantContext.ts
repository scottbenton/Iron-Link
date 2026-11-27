import { createContext } from "react";

import { PageTabsVariant } from "./pageTabsTypes";

export const PageTabsVariantContext =
  createContext<PageTabsVariant>("underline");
