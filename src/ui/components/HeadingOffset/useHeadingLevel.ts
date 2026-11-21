import { useContext } from "react";

import { HeadingLevel, getHeadingLevel } from "./headingLevel";
import { HeadingOffsetContext } from "./headingOffsetContext";

/** The level of a heading written at `level` in the surrounding surface. */
export function useHeadingLevel(level: number): HeadingLevel {
  return getHeadingLevel(level, useContext(HeadingOffsetContext));
}
