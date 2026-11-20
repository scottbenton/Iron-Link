import { createContext } from "react";

export type HeadingLevel = 2 | 3 | 4 | 5 | 6;

/** Where a category sits: its depth and the heading level it renders. */
export const CategoryContext = createContext<{
  depth: number;
  headingLevel: HeadingLevel;
} | null>(null);
