import { createContext } from "react";

import type { HeadingLevel } from "../../components/HeadingOffset";

/** The levels a category's heading may be written at. */
export type CategoryHeadingLevel = 2 | 3 | 4 | 5 | 6;

/** Where a category sits: its depth and the heading level it renders. */
export const CategoryContext = createContext<{
  depth: number;
  headingLevel: HeadingLevel;
} | null>(null);
