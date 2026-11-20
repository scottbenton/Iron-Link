import { createContext } from "react";

import { SectionTabsSize, SectionTabsVariant } from "./sectionTabsTypes";

export const VariantContext = createContext<{
  variant: SectionTabsVariant;
  size: SectionTabsSize;
}>({ variant: "well", size: "md" });
