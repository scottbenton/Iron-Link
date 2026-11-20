import { createContext } from "react";

import {
  ToggleGroupTone,
  ToggleGroupVariant,
  ToggleSize,
} from "./toggleGroupTypes";

export const ToggleGroupContext = createContext<{
  size: ToggleSize;
  tone: ToggleGroupTone;
  variant: ToggleGroupVariant;
}>({ size: "md", tone: "accent", variant: "outline" });
