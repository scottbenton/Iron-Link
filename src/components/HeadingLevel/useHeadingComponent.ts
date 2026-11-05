import { useContext } from "react";

import { HeadingComponent, getHeadingComponent } from "./headingLevel";
import { HeadingOffsetContext } from "./headingOffsetContext";

// The element for a heading written at `level` in the surrounding surface.
export function useHeadingComponent(level: number): HeadingComponent {
  return getHeadingComponent(level, useContext(HeadingOffsetContext));
}
